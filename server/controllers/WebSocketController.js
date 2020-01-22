const WebSocket = require ('ws');
const WorkerState = require('../core/WorkerState');//singleton
const utils = require('../core/utils');

const cleanPeriod = 1*60*1000;//1 минута
const closeSocketOnIdle = 5*60*1000;//5 минут

class WebSocketController {
    constructor(wss, config) {
        this.config = config;
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
            ws.lastActivity = Date.now();
            req = JSON.parse(message);
            switch (req.action) {
                case 'test':
                    this.test(req, ws); break;
                case 'worker-get-state':
                    this.workerGetState(req, ws); break;
                case 'worker-get-state-finish':
                    this.workerGetStateFinish(req, ws); break;

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
            let r = Object.assign({}, res);
            if (req.requestId)
                r.requestId = req.requestId;
            ws.send(JSON.stringify(r));
        }
    }

    //Actions
    async test(req, ws) {
        this.send({message: 'Liberama project is awesome'}, req, ws);
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

}

module.exports = WebSocketController;
