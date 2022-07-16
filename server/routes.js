const c = require('./controllers');
const utils = require('./core/utils');
const multer = require('multer');

function initRoutes(app, wss, config) {
    //эксклюзив для update_checker
    if (config.mode === 'book_update_checker') {
        new c.BookUpdateCheckerController(wss, config);
        return;
    }
        
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

module.exports = {
    initRoutes
}
