const WebSocket = require ('ws');
const _ = require('lodash');

const ReaderWorker = require('../core/Reader/ReaderWorker');//singleton
const ReaderStorage = require('../core/Reader/ReaderStorage');//singleton
const WorkerState = require('../core/WorkerState');//singleton
const log = new (require('../core/AppLogger'))().log;//singleton
const utils = require('../core/utils');

const cleanPeriod = 1*60*1000;//1 минута
const closeSocketOnIdle = 5*60*1000;//5 минут

class WebSocketController {
    constructor(wss, config) {
        this.config = config;
        this.isDevelopment = (config.branch == 'development');

        this.readerStorage = new ReaderStorage();
        this.readerWorker = new ReaderWorker(config);
        this.workerState = new WorkerState();

        this.wss = wss;

        wss.on('connection', (ws) => {
            ws.on('message', (message) => {
                this.onMessage(ws, message);
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

            ws.lastActivity = Date.now();
            req = JSON.parse(message);
            switch (req.action) {
                case 'test':
                    await this.test(req, ws); break;
                case 'get-config':
                    await this.getConfig(req, ws); break;
                case 'worker-get-state':
                    await this.workerGetState(req, ws); break;
                case 'worker-get-state-finish':
                    await this.workerGetStateFinish(req, ws); break;
                case 'reader-restore-cached-file':
                    await this.readerRestoreCachedFile(req, ws); break;
                case 'reader-storage':
                    await this.readerStorageDo(req, ws); break;

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
            this.send(_.pick(this.config, req.params), req, ws);
        } else {
            throw new Error('params is not an array');
        }
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
            state = this.workerState.getState(req.workerId);

            this.send((state ? state : {}), req, ws);
            if (!state) break;

            if (state.state != 'finish' && state.state != 'error')
                await utils.sleep(refreshPause);
            else
                break;

            i++;
            if (i > 2*60*1000/refreshPause) {//2 мин ждем телодвижений воркера
                this.send({state: 'error', error: 'Время ожидания процесса истекло'}, req, ws);
            }
            i = (prevProgress != state.progress || prevState != state.state ? 1 : i);
        }        
    }

    async readerRestoreCachedFile(req, ws) {
        if (!req.path)
            throw new Error(`key 'path' is empty`);

        const workerId = this.readerWorker.restoreCachedFile(req.path);
        const state = this.workerState.getState(workerId);
        this.send((state ? state : {}), req, ws);
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
}

module.exports = WebSocketController;
