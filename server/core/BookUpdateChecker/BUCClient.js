const WebSocketConnection = require('../WebSocketConnection');
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
            this.appDb = this.connManager.db['app'];

            this.wsc = new WebSocketConnection(config.bucServer.url, 10, 30, {rejectUnauthorized: false});
            this.accessToken = config.bucServer.accessToken;

            //константы
            if (this.config.branch !== 'development') {
                this.cleanQueryInterval = 300*dayMs;//интервал очистки устаревших
                this.syncPeriod = 1*hourMs;//период синхронизации с сервером BUC
                this.sendBookUrlsPeriod = 1*minuteMs;//период отправки BookUrls на сервер BUC
            } else {
                this.cleanQueryInterval = 300*dayMs;//интервал очистки устаревших
                this.syncPeriod = 1*minuteMs;//период синхронизации с сервером BUC
                this.sendBookUrlsPeriod = 1*1000;//период отправки BookUrls на сервер BUC
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
            await this.wsc.send(Object.assign({accessToken: this.accessToken}, query), 60),
            60
        );
        if (response.error)
            throw new Error(response.error);
        return response;
    }

    async wsGetBuc(fromCheckTime, callback) {
        const requestId = await this.wsc.send({accessToken: this.accessToken, action: 'get-buc', fromCheckTime}, 60);
        while (1) {//eslint-disable-line
            const res = await this.wsc.message(requestId, 60);

            if (res.state == 'get') {
                await callback(res.rows);
            } else {
                break;
            }
        }
    }

    async wsUpdateBuc(bookUrls) {
        return await this.wsRequest({action: 'update-buc', bookUrls});
    }

    async checkBuc(bookUrls) {
        const db = this.appDb;

        for (const url of bookUrls)
            this.bookUrls.add(url);

        const rows = await db.select({
            table: 'buc',
            map: `(r) => ({id: r.id, size: r.size})`,
            where: `@@id(${db.esc(bookUrls)})`,
        });

        return rows;
    }

    async findMaxCheckTime() {
        const db = this.appDb;

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
                });

                if (maxId)
                    result.add(maxId);

                return result;
            `
        });

        if (rows.length)
            result = rows[0].checkTime;

        return result;
    }

    async periodicSendBookUrls() {
        while (1) {//eslint-disable-line
            try {
                //отправим this.bookUrls
                if (this.bookUrls.size) {
                    log(`client: remote update buc begin`);

                    const arr = Array.from(this.bookUrls);
                    this.bookUrls = new Set();

                    const chunkSize = 100;
                    let updated = 0;
                    for (let i = 0; i < arr.length; i += chunkSize) {
                        const chunk = arr.slice(i, i + chunkSize);
                        
                        const res = await this.wsUpdateBuc(chunk);
                        if (!res.error && res.state == 'success') {
                            //update success
                            updated += chunk.length;
                        } else {
                            for (const url of chunk) {
                                this.bookUrls.add(url);
                            }
                            log(LM_ERR, `update-buc error: ${(res.error ? res.error : `wrong state "${res.state}"`)}`);
                        }
                    }
                    log(`client: remote update buc end, updated ${updated} urls`);
                }
            } catch (e) {
                log(LM_ERR, e.stack);
            }

            await utils.sleep(this.sendBookUrlsPeriod);
        }
    }

    async periodicSync() {
        const db = this.appDb;

        while (1) {//eslint-disable-line
            try {
                //почистим нашу таблицу 'buc'
                log(`client: clean 'buc' table begin`);
                const cleanTime = Date.now() - this.cleanQueryInterval;
                while (1) {//eslint-disable-line
                    //выборка всех по кусочкам
                    const rows = await db.select({
                        table: 'buc',
                        where: `
                            let iter = @getItem('clean');
                            if (!iter) {
                                iter = @all();
                                @setItem('clean', iter);
                            }

                            const ids = new Set();
                            let id = iter.next();
                            while (!id.done && ids.size < 1000) {
                                ids.add(id.value);
                                id = iter.next();
                            }

                            return ids;
                        `
                    });

                    if (rows.length) {
                        const toDelIds = [];
                        for (const row of rows)
                            if (row.queryTime <= cleanTime)
                                toDelIds.push(row.id);

                        //удаление
                        const res = await db.delete({
                            table: 'buc',
                            where: `@@id(${db.esc(toDelIds)})`,
                        });

                        log(`client: clean 'buc' deleted ${res.deleted}`);
                    } else {
                        break;
                    }
                }
                await db.select({
                    table: 'buc',
                    where: `
                        @delItem('clean');
                        return new Set();
                    `
                });

                log(`client: clean 'buc' table end`);

                //синхронизация с сервером BUC
                log(`client: sync 'buc' table begin`);
                this.fromCheckTime -= 30*minuteMs;//минус полчаса на всякий случай
                await this.wsGetBuc(this.fromCheckTime, async(rows) => {
                    for (const row of rows) {
                        if (row.checkTime > this.fromCheckTime)
                            this.fromCheckTime = row.checkTime;
                    }

                    const res = await db.insert({
                        table: 'buc',
                        replace: true,
                        rows
                    });
    
                    log(`client: sync 'buc' table, inserted ${res.inserted} rows, replaced ${res.replaced}`);
                });
                log(`client: sync 'buc' table end`);
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
            
            this.periodicSendBookUrls();//no await
            this.periodicSync();//no await

            log(`BUC Client started`);
        } catch (e) {
            log(LM_FATAL, e.stack);
            ayncExit.exit(1);
        }
    }
}

module.exports = BUCClient;