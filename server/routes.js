const fs = require('fs-extra');
const path = require('path');

const express = require('express');
const multer = require('multer');

const ReaderWorker = require('./core/Reader/ReaderWorker');//singleton

const c = require('./controllers');
const utils = require('./core/utils');

function initRoutes(app, wss, config) {
    //эксклюзив для update_checker
    if (config.mode === 'book_update_checker') {
        new c.BookUpdateCheckerController(wss, config);
        return;
    }

    initStatic(app, config);
        
    const misc = new c.MiscController(config);
    const reader = new c.ReaderController(config);
    const worker = new c.WorkerController(config);
    new c.WebSocketController(wss, config);

    //access
    const [aAll, aNormal, aSite, aReader, aOmnireader] = // eslint-disable-line no-unused-vars
        [config.mode, 'normal', 'site', 'reader', 'omnireader'];

    //multer
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, config.uploadDir);
        },
        filename: (req, file, cb) => {
            cb(null, utils.randomHexString(30));
        }
    });
    const upload = multer({ storage, limits: {fileSize: config.maxUploadFileSize} });

    //routes
    const routes = [
        ['POST', '/api/config', misc.getConfig.bind(misc), [aAll], {}],
        ['POST', '/api/reader/load-book', reader.loadBook.bind(reader), [aAll], {}],
        ['POST', '/api/reader/storage', reader.storage.bind(reader), [aAll], {}],
        ['POST', '/api/reader/upload-file', [upload.single('file'), reader.uploadFile.bind(reader)], [aAll], {}],
        ['POST', '/api/reader/restore-cached-file', reader.restoreCachedFile.bind(reader), [aAll], {}],        
        ['POST', '/api/worker/get-state', worker.getState.bind(worker), [aAll], {}],
    ];

    //to app
    for (let route of routes) {
        let callbacks = [];
        let [httpMethod, path, controllers, access, options] = route;
        let controller = controllers;
        if (Array.isArray(controllers)) {
            controller = controllers[controllers.length - 1];
            callbacks = controllers.slice(0, -1);
        }

        access = new Set(access);

        let callback = () => {};
        if (access.has(config.mode)) {//allowed
            callback = async function(req, res) {
                try {
                    const result = await controller(req, res, options);

                    if (result !== false)
                        res.send(result);
                } catch (e) {
                    res.status(500).send({error: e.message});
                }
            };
        } else {//forbidden
            callback = async function(req, res) {
                res.status(403);
            };
        }
        callbacks.push(callback);

        switch (httpMethod) {
            case 'GET' :
                app.get(path, ...callbacks);
                break;
            case 'POST':
                app.post(path, ...callbacks);
                break;
            default: 
                throw new Error(`initRoutes error: unknown httpMethod: ${httpMethod}`);
        }
    }
}

function initStatic(app, config) {
    const readerWorker = new ReaderWorker(config);

    //восстановление файлов в /tmp и /upload из webdav-storage, при необходимости
    app.use(async(req, res, next) => {
        if ((req.method !== 'GET' && req.method !== 'HEAD') ||
            !(req.path.indexOf('/tmp/') === 0 || req.path.indexOf('/upload/') === 0)
            ) {
            return next();
        }

        const filePath = `${config.publicDir}${req.path}`;

        //восстановим
        if (!await fs.pathExists(filePath)) {
            /*const zlib = require('zlib');
            const gzipBuffer = async(buf) => {
                return new Promise((resolve, reject) => {
                    zlib.gzip(buf, {level: 1}, (err, result) => {
                        if (err) reject(err);
                        resolve(result);
                    });
                });
            };

            await fs.writeFile(filePath, await gzipBuffer(`<filepath>${filePath}</filepath>`));*/
        }

        return next();
    });

    const tmpDir = `${config.publicDir}/tmp`;
    app.use(express.static(config.publicDir, {
        maxAge: '30d',

        setHeaders: (res, filePath) => {
            if (path.dirname(filePath) == tmpDir) {
                res.set('Content-Type', 'application/xml');
                res.set('Content-Encoding', 'gzip');
            }
        },
    }));
}

module.exports = {
    initRoutes
}
