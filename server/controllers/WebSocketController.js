const WebSocket = require ('ws');
const _ = require('lodash');

const ReaderWorker = require('../core/Reader/ReaderWorker');//singleton
const JembaReaderStorage = require('../core/Reader/JembaReaderStorage');//singleton
const WorkerState = require('../core/WorkerState');//singleton
const BUCClient = require('../core/BookUpdateChecker/BUCClient');//singleton
const log = new (require('../core/AppLogger'))().log;//singleton
const utils = require('../core/utils');

const cleanPeriod = 1*60*1000;//1 минута
const closeSocketOnIdle = 5*60*1000;//5 минут

class WebSocketController {
    constructor(wss, config) {
        this.config = config;
        this.isDevelopment = (config.branch == 'development');

        this.readerStorage = new JembaReaderStorage();
        this.readerWorker = new ReaderWorker(config);
        this.workerState = new WorkerState();

        if (config.bucEnabled) {
            this.bucClient = new BUCClient(config);
        }

        this.wss = wss;

        wss.on('connection', (ws) => {
            ws.on('message', (message) => {
                this.onMessage(ws, message.toString());
            });

            ws.on('error', (err) => {
                log(LM_ERR, err);
            });
        });

        setTimeout(() => { this.periodicClean(); }, cleanPeriod);
    }

    periodicClean() {
        try {
            const now = Date.now();
            this.wss.clients.forEach((ws) => {
                if (!ws.lastActivity || now - ws.lastActivity > closeSocketOnIdle - 50) {
                    ws.terminate();
                }
            });
        } finally {
            setTimeout(() => { this.periodicClean(); }, cleanPeriod);
        }
    }

    async onMessage(ws, message) {
        let req = {};
        try {
            if (this.isDevelopment) {
                log(`WebSocket-IN:  ${message.substr(0, 4000)}`);
            }

            req = JSON.parse(message);

            ws.lastActivity = Date.now();
            
            //pong for WebSocketConnection
            this.send({_rok: 1}, req, ws);

            switch (req.action) {
                case 'test':
                    await this.test(req, ws); break;
                case 'get-config':
                    await this.getConfig(req, ws); break;
                case 'load-book':
                    await this.loadBook(req, ws); break;
                case 'worker-get-state':
                    await this.workerGetState(req, ws); break;
                case 'worker-get-state-finish':
                    await this.workerGetStateFinish(req, ws); break;
                case 'reader-storage':
                    await this.readerStorageDo(req, ws); break;
                case 'upload-file-buf':
                    await this.uploadFileBuf(req, ws); break;
                case 'upload-file-touch':
                    await this.uploadFileTouch(req, ws); break;
                case 'check-buc':
                    await this.checkBuc(req, ws); break;

                default:
                    throw new Error(`Action not found: ${req.action}`);
            }
        } catch (e) {
            this.send({error: e.message}, req, ws);
        }
    }

    send(res, req, ws) {
        if (ws.readyState == WebSocket.OPEN) {
            ws.lastActivity = Date.now();
            let r = res;
            if (req.requestId)
                r = Object.assign({requestId: req.requestId}, r);

            const message = JSON.stringify(r);
            ws.send(message);

            if (this.isDevelopment) {
                log(`WebSocket-OUT: ${message.substr(0, 4000)}`);
            }

        }
    }

    //Actions ------------------------------------------------------------------
    async test(req, ws) {
        this.send({message: 'Liberama project is awesome'}, req, ws);
    }

    async getConfig(req, ws) {
        if (Array.isArray(req.params)) {
            const paramsSet = new Set(req.params);

            this.send(_.pick(this.config, this.config.webConfigParams.filter(x => paramsSet.has(x))), req, ws);
        } else {
            throw new Error('params is not an array');
        }
    }

    async loadBook(req, ws) {
        const workerId = this.readerWorker.loadBookUrl({
            url: req.url, 
            enableSitesFilter: (_.has(req, 'enableSitesFilter') ? req.enableSitesFilter : true),
            skipHtmlCheck: (_.has(req, 'skipHtmlCheck') ? req.skipHtmlCheck : false),
            isText: (_.has(req, 'isText') ? req.isText : false),
            uploadFileName: (_.has(req, 'uploadFileName') ? req.uploadFileName : false),
            djvuQuality: (_.has(req, 'djvuQuality') ? req.djvuQuality : false),
            pdfAsText: (_.has(req, 'pdfAsText') ? req.pdfAsText : false),
            pdfQuality: (_.has(req, 'pdfQuality') ? req.pdfQuality : false),
        });
        const state = this.workerState.getState(workerId);

        this.send((state ? state : {}), req, ws);
    }

    async workerGetState(req, ws) {
        if (!req.workerId)
            throw new Error(`key 'workerId' is wrong`);

        const state = this.workerState.getState(req.workerId);
        this.send((state ? state : {}), req, ws);
    }

    async workerGetStateFinish(req, ws) {
        if (!req.workerId)
            throw new Error(`key 'workerId' is wrong`);

        const refreshPause = 200;
        let i = 0;
        let state = {};
        while (1) {// eslint-disable-line no-constant-condition
            const prevProgress = state.progress || -1;
            const prevState = state.state || '';
            const lastModified = state.lastModified || 0;
            state = this.workerState.getState(req.workerId);

            this.send((state && lastModified != state.lastModified ? state : {}), req, ws);
            if (!state) break;

            if (state.state != 'finish' && state.state != 'error')
                await utils.sleep(refreshPause);
            else
                break;

            i++;
            if (i > 3*60*1000/refreshPause) {//3 мин ждем телодвижений воркера
                this.send({state: 'error', error: 'Время ожидания процесса истекло'}, req, ws);
                break;
            }
            i = (prevProgress != state.progress || prevState != state.state ? 1 : i);
        }        
    }

    async readerStorageDo(req, ws) {
        if (!req.body)
            throw new Error(`key 'body' is empty`);
        if (!req.body.action)
            throw new Error(`key 'action' is empty`);
        if (!req.body.items || Array.isArray(req.body.data))
            throw new Error(`key 'items' is empty`);

        this.send(await this.readerStorage.doAction(req.body), req, ws);
    }

    async uploadFileBuf(req, ws) {
        if (!req.buf)
            throw new Error(`key 'buf' is empty`);
        
        this.send({url: await this.readerWorker.saveFileBuf(req.buf)}, req, ws);
    }

    async uploadFileTouch(req, ws) {
        if (!req.url)
            throw new Error(`key 'url' is empty`);
        
        this.send({url: await this.readerWorker.uploadFileTouch(req.url)}, req, ws);
    }

    async checkBuc(req, ws) {
        if (!this.config.bucEnabled)
            throw new Error('BookUpdateChecker disabled');

        if (!req.bookUrls)
            throw new Error(`key 'bookUrls' is empty`);

        if (!Array.isArray(req.bookUrls))
            throw new Error(`key 'bookUrls' must be array`);

        const data = await this.bucClient.checkBuc(req.bookUrls);

        this.send({state: 'success', data}, req, ws);
    }
}

module.exports = WebSocketController;
