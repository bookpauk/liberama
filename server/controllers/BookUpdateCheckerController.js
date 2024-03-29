const WebSocket = require('ws');
//const _ = require('lodash');

const BUCServer = require('../core/BookUpdateChecker/BUCServer');
const log = new (require('../core/AppLogger'))().log;//singleton
//const utils = require('../core/utils');

const cleanPeriod = 1*60*1000;//1 минута
const closeSocketOnIdle = 5*60*1000;//5 минут

class BookUpdateCheckerController {
    constructor(wss, config) {
        this.config = config;
        this.isDevelopment = (config.branch == 'development');

        this.accessToken = config.accessToken;
        this.bucServer = new BUCServer(config);

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
                log(`BUC-WebSocket-IN:  ${message.substr(0, 4000)}`);
            }

            req = JSON.parse(message);

            ws.lastActivity = Date.now();
            
            //pong for WebSocketConnection
            this.send({_rok: 1}, req, ws);

            if (req.accessToken !== this.accessToken)
                throw new Error('Access denied');

            switch (req.action) {
                case 'test':
                    await this.test(req, ws); break;
                case 'get-buc':
                    await this.getBuc(req, ws); break;
                case 'update-buc':
                    await this.updateBuc(req, ws); break;

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
                log(`BUC-WebSocket-OUT: ${message.substr(0, 4000)}`);
            }

        }
    }

    //Actions ------------------------------------------------------------------
    async test(req, ws) {
        this.send({message: 'Liberama project is awesome'}, req, ws);
    }

    async getBuc(req, ws) {
        if (!req.fromCheckTime)
            throw new Error(`key 'fromCheckTime' is empty`);

        await this.bucServer.getBuc(req.fromCheckTime, (rows) => {
            this.send({state: 'get', rows}, req, ws);
        });

        this.send({state: 'finish'}, req, ws);
    }

    async updateBuc(req, ws) {
        if (!req.bookUrls)
            throw new Error(`key 'bookUrls' is empty`);

        if (!Array.isArray(req.bookUrls))
            throw new Error(`key 'bookUrls' must be array`);

        await this.bucServer.updateBuc(req.bookUrls);

        this.send({state: 'success'}, req, ws);
    }
}

module.exports = BookUpdateCheckerController;
