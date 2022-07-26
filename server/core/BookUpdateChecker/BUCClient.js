const WebSocketConnection = require('./WebSocketConnection');
const JembaConnManager = require('../../db/JembaConnManager');//singleton

const ayncExit = new (require('../AsyncExit'))();
const utils = require('../utils');
const log = new (require('../AppLogger'))().log;//singleton

const minuteMs = 60*1000;
const hourMs = 60*minuteMs;
const dayMs = 24*hourMs;

let instance = null;

//singleton
class BUCClient {
    constructor(config) {
        if (!instance) {
            this.config = config;

            this.connManager = new JembaConnManager();
            this.db = this.connManager.db['book-update-server'];

            this.wsc = new WebSocketConnection(config.bucServer.url, 10, 30, {rejectUnauthorized: false});
            this.accessToken = config.bucServer.accessToken;

            //константы
            if (this.config.branch !== 'development') {
                this.cleanQueryInterval = 300*dayMs;//интервал очистки устаревших
                this.syncPeriod = 1*hourMs;//период синхронизации с сервером BUC
            } else {
                this.cleanQueryInterval = 300*dayMs;//интервал очистки устаревших
                this.syncPeriod = 1*minuteMs;//период синхронизации с сервером BUC
            }

            this.fromCheckTime = 1;
            this.bookUrls = new Set();

            this.main();//no await

            instance = this;
        }

        return instance;
    }

    async wsRequest(query) {
        const response = await this.wsc.message(
            await this.wsc.send(Object.assign({accessToken: this.accessToken}, query), 600),
            600
        );
        if (response.error)
            throw new Error(response.error);
        return response;
    }

    async wsUpdateBuc(bookUrls) {
        return await this.wsRequest({action: 'update-buc', bookUrls});
    }

    async checkBuc(bookUrls) {
        const db = this.db;

        for (const url of bookUrls)
            this.bookUrls.add(url);

        const rows = await db.select({
            table: 'buc',
            where: `@@id(${db.esc(bookUrls)})`
        });

        return rows;
    }

    async findMaxCheckTime() {
        const db = this.db;

        let result = 1;

        //одним куском, возможно будет жрать память
        const rows = await db.select({
            table: 'buc',
            where: `
                const result = new Set();
                let max = 0;
                let maxId = null;

                @iter(@all(), (row) => {
                    if (row.checkTime > max) {
                        max = row.checkTime;
                        maxId = row.id;
                    }
                };

                if (maxId)
                    result.add(maxId);

                return result;
            `
        });

        if (rows.length)
            result = rows[0].checkTime;

        return result;
    }

    async periodicSync() {
        while (1) {//eslint-disable-line
            try {
                //сначала отправим this.bookUrls
                const arr = Array.from(this.bookUrls);
                this.bookUrls = new Set();

                const chunkSize = 100;
                for (let i = 0; i < arr.length; i += chunkSize) {
                    const chunk = arr.slice(i, i + chunkSize);
                    
                    const res = await this.wsUpdateBuc(chunk);
                    if (!res.error && res.state == 'success') {
                        //update success
                    } else {
                        for (const url of chunk) {
                            this.bookUrls.add(url);
                        }
                        log(LM_ERR, `update-buc error: ${(res.error ? res.error : `wrong state "${res.state}"`)}`);
                    }
                }

                //почистим нашу таблицу 'buc'
                this.cleanQueryInterval

                //синхронизация с сервером BUC
            } catch (e) {
                log(LM_ERR, e.stack);
            }

            await utils.sleep(this.syncPeriod);
        }
    }

    async main() {
        try {
            if (!this.config.bucEnabled)
                throw new Error('BookUpdateChecker disabled');

            this.fromCheckTime = await this.findMaxCheckTime();
            
            this.periodicSync();//no await

            log(`BUC Client started`);
        } catch (e) {
            log(LM_FATAL, e.stack);
            ayncExit.exit(1);
        }
    }
}

module.exports = BUCClient;