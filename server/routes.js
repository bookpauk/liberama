const fs = require('fs-extra');
const path = require('path');

const express = require('express');
const multer = require('multer');

const ReaderWorker = require('./core/Reader/ReaderWorker');//singleton
const log = new (require('./core/AppLogger'))().log;//singleton
const webAppDir = require('../build/appdir');

const {
    ReaderController,
    WebSocketController,
    BookUpdateCheckerController,
} = require('./controllers');

const utils = require('./core/utils');

function initRoutes(app, wss, config) {
    //эксклюзив для update_checker
    if (config.mode === 'book_update_checker') {
        new BookUpdateCheckerController(wss, config);
        return;
    }

    if (config.mode !== 'reader' && config.mode !== 'omnireader' && config.mode !== 'liberama')
        throw new Error(`Unknown server mode: ${config.mode}`);

    initStatic(app, config);
        
    const reader = new ReaderController(config);
    new WebSocketController(wss, config);

    //multer
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, config.uploadPublicDir);
        },
        filename: (req, file, cb) => {
            cb(null, utils.randomHexString(30));
        }
    });
    const upload = multer({ storage, limits: {fileSize: config.maxUploadFileSize} });

    //routes
    const routes = [
        ['POST', '/api/reader/upload-file', [upload.single('file'), reader.uploadFile.bind(reader)]],
    ];

    //to app
    for (let route of routes) {
        let callbacks = [];
        let [httpMethod, actionPath, controllers] = route;
        let controller = controllers;
        if (Array.isArray(controllers)) {
            controller = controllers[controllers.length - 1];
            callbacks = controllers.slice(0, -1);
        }

        const callback = async function(req, res) {
            try {
                const result = await controller(req, res);

                if (result !== false)
                    res.send(result);
            } catch (e) {
                res.status(500).send({error: e.message});
            }
        };
        callbacks.push(callback);

        switch (httpMethod) {
            case 'GET' :
                app.get(actionPath, ...callbacks);
                break;
            case 'POST':
                app.post(actionPath, ...callbacks);
                break;
            default: 
                throw new Error(`initRoutes error: unknown httpMethod: ${httpMethod}`);
        }
    }
}

function initStatic(app, config) {
    const readerWorker = new ReaderWorker(config);

    //восстановление файлов в /tmp и /upload из webdav-storage, при необходимости
    app.use(`${config.rootPathStatic}/tmp`,
        async(req, res, next) => {
            if (req.method !== 'GET' && req.method !== 'HEAD') {
                return next();
            }

            const filePath = `${config.tempPublicDir}${req.path}`;

            //восстановим
            try {
                if (!await fs.pathExists(filePath))
                    await readerWorker.restoreRemoteFile(req.path, '/tmp');
            } catch(e) {
                log(LM_ERR, `static::restoreRemoteFile ${filePath} > ${e.message}`);
            }

            return next();
        },
        express.static(config.tempPublicDir, {
            setHeaders: (res) => {
                res.set('Content-Type', 'application/xml');
                res.set('Content-Encoding', 'gzip');
            },
        })
    );

    app.use(`${config.rootPathStatic}/upload`,
        async(req, res, next) => {
            if (req.method !== 'GET' && req.method !== 'HEAD') {
                return next();
            }

            const filePath = `${config.uploadPublicDir}${req.path}`;

            //восстановим
            try {
                if (!await fs.pathExists(filePath))
                    await readerWorker.restoreRemoteFile(req.path, '/upload');
            } catch(e) {
                log(LM_ERR, `static::restoreRemoteFile ${filePath} > ${e.message}`);
            }

            return next();
        },
        express.static(config.uploadPublicDir)
    );

    if (config.rootPathStatic) {
        //для правильной замены строк вида `${webAppDir}` нужна будет rootPathStatic без начального слеша
        const rootPathStaticWithoutSlash = config.rootPathStatic.substring(1);

        //подмена rootPath в файлах статики WebApp при необходимости
        //костыльно...
        app.use(config.rootPathStatic, async(req, res, next) => {
            if (req.method !== 'GET' && req.method !== 'HEAD') {
                return next();
            }

            try {
                const reqPath = (req.path == '/' ? '/index.html' : req.path);
                const ext = path.extname(reqPath);
                if (ext == '.html' || ext == '.js' || ext == '.css') {
                    const reqFile = `${config.publicDir}${reqPath}`;
                    const flagFile = `${reqFile}.replaced`;

                    if (!await fs.pathExists(flagFile) && await fs.pathExists(reqFile)) {
                        const content = await fs.readFile(reqFile, 'utf8');
                        const re = new RegExp(webAppDir, 'g');
                        await fs.writeFile(reqFile, content.replace(re, `${rootPathStaticWithoutSlash}/${webAppDir}`));
                        await fs.writeFile(flagFile, '');
                    }
                }
            } catch(e) {
                log(LM_ERR, e.message);
            }

            return next();
        });
    }

    app.use(config.rootPathStatic, express.static(config.publicDir));
}

module.exports = {
    initRoutes
}
