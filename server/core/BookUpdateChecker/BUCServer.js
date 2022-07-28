const fs = require('fs-extra');

const FileDownloader = require('../FileDownloader');
const JembaConnManager = require('../../db/JembaConnManager');//singleton

const ayncExit = new (require('../AsyncExit'))();
const utils = require('../utils');
const log = new (require('../AppLogger'))().log;//singleton

const minuteMs = 60*1000;
const hourMs = 60*minuteMs;
const dayMs = 24*hourMs;

let instance = null;

//singleton
class BUCServer {
    constructor(config) {
        if (!instance) {
            this.config = config;

            //константы
            if (this.config.branch !== 'development') {
                this.maxCheckQueueLength = 10000;//максимальная длина checkQueue
                this.fillCheckQueuePeriod = 1*minuteMs;//период пополнения очереди
                this.periodicCheckWait = 500;//пауза, если нечего делать

                this.cleanQueryInterval = 300*dayMs;//интервал очистки устаревших
                this.oldQueryInterval = 30*dayMs;//интервал устаревания запроса на обновление
                this.checkingInterval = 3*hourMs;//интервал проверки обновления одного и того же файла
                this.sameHostCheckInterval = 1000;//интервал проверки файла на том же сайте, не менее
            } else {
                this.maxCheckQueueLength = 10;//максимальная длина checkQueue
                this.fillCheckQueuePeriod = 10*1000;//период пополнения очереди
                this.periodicCheckWait = 500;//пауза, если нечего делать

                this.cleanQueryInterval = 300*dayMs;//интервал очистки устаревших
                this.oldQueryInterval = 30*dayMs;//интервал устаревания запроса на обновление
                this.checkingInterval = 30*1000;//интервал проверки обновления одного и того же файла
                this.sameHostCheckInterval = 1000;//интервал проверки файла на том же сайте, не менее
            }

            
            this.config.tempDownloadDir = `${config.tempDir}/download`;
            fs.ensureDirSync(this.config.tempDownloadDir);

            this.down = new FileDownloader(config.maxUploadFileSize);            

            this.connManager = new JembaConnManager();
            this.db = this.connManager.db['book-update-server'];
            
            this.checkQueue = [];
            this.hostChecking = {};

            this.main(); //no await

            instance = this;
        }

        return instance;
    }

    async getBuc(fromCheckTime, callback) {
        const db = this.db;

        const iterName = utils.randomHexString(30);

        while (1) {//eslint-disable-line
            const rows = await db.select({
                table: 'buc',
                where: `
                    let iter = @getItem(${db.esc(iterName)});
                    if (!iter) {
                        iter = @dirtyIndexLR('checkTime', ${db.esc(fromCheckTime)});
                        iter = iter.values();
                        @setItem(${db.esc(iterName)}, iter);
                    }

                    const ids = new Set();
                    let id = iter.next();
                    while (!id.done && ids.size < 100) {
                        ids.add(id.value);
                        id = iter.next();
                    }

                    return ids;
                `
            });

            if (rows.length)
                callback(rows);
            else
                break;
        }

        await db.select({
            table: 'buc',
            where: `
                @delItem(${db.esc(iterName)});
                return new Set();
            `
        });
    }

    async updateBuc(bookUrls) {
        const db = this.db;
        const now = Date.now();

        const rows = await db.select({
            table: 'buc',
            map: `(r) => ({id: r.id})`,
            where: `@@id(${db.esc(bookUrls)})`
        });

        const exists = new Set();
        for (const row of rows) {
            exists.add(row.id);
        }

        const toUpdateIds = [];
        const toInsertRows = [];
        for (let id of bookUrls) {
            if (!id)
                continue;

            if (id.length > 1000) {
                id = id.substring(0, 1000);
            }

            if (exists.has(id)) {
                toUpdateIds.push(id);
            } else {
                toInsertRows.push({
                    id,
                    queryTime: now,
                    checkTime: 0, // 0 - never checked
                    etag: '',
                    modTime: '',
                    size: 0,
                    checkSum: '', //sha256
                    state: 0, // 0 - not processing, 1 - processing
                    error: '',
                });
            }
        }

        if (toUpdateIds.length) {
            await db.update({
                table: 'buc',
                mod: `(r) => r.queryTime = ${db.esc(now)}`,
                where: `@@id(${db.esc(toUpdateIds)})`
            });
        }

        if (toInsertRows.length) {
            await db.insert({
                table: 'buc',
                ignore: true,
                rows: toInsertRows,
            });
        }
    }

    async fillCheckQueue() {
        const db = this.db;

        while (1) {//eslint-disable-line
            try {
                let now = Date.now();

                //чистка совсем устаревших
                let rows = await db.select({
                    table: 'buc',
                    where: `@@dirtyIndexLR('queryTime', undefined, ${db.esc(now - this.cleanQueryInterval)})`
                });

                if (rows.length) {
                    const ids = rows.map((r) => r.id);
                    const res = await db.delete({
                        table: 'buc',
                        where: `@@id(${db.esc(ids)})`,
                    });

                    log(LM_WARN, `clean 'buc' table: deleted ${res.deleted}`);
                }

                rows = await db.select({table: 'buc', count: true});
                log(LM_WARN, `'buc' table length: ${rows[0].count}`);

                now = Date.now();
                //выборка кандидатов
                rows = await db.select({
                    table: 'buc',
                    where: `
                        @@and(
                            @dirtyIndexLR('queryTime', ${db.esc(now - this.oldQueryInterval)}),
                            @dirtyIndexLR('checkTime', undefined, ${db.esc(now - this.checkingInterval)}),
                            @flag('notProcessing')
                        );
                    `
                });

//console.log(rows);

                if (rows.length) {
                    const ids = [];

                    for (const row of rows) {
                        if (this.checkQueue.length >= this.maxCheckQueueLength)
                            break;

                        ids.push(row.id);
                        this.checkQueue.push(row);
                    }

                    await db.update({
                        table: 'buc',
                        mod: `(r) => r.state = 1`,
                        where: `@@id(${db.esc(ids)})`
                    });
                    
                    log(LM_WARN, `checkQueue: added ${ids.length} recs, total ${this.checkQueue.length}`);
                }
            } catch(e) {
                log(LM_ERR, e.stack);
            }

            await utils.sleep(this.fillCheckQueuePeriod);
        }
    }

    async periodicCheck() {
        const db = this.db;

        while (1) {//eslint-disable-line
            try {
                if (!this.checkQueue.length)
                    await utils.sleep(this.periodicCheckWait);

                if (!this.checkQueue.length)
                    continue;

                const row = this.checkQueue.shift();

                const url = new URL(row.id);

                //только если обращались к тому же хосту не ранее sameHostCheckInterval миллисекунд назад
                if (!this.hostChecking[url.hostname]) {
                    this.hostChecking[url.hostname] = true;

                    try {
                        let unchanged = true;
                        let size = 0;
                        let hash = '';

                        const headers = await this.down.head(row.id);

                        const etag = headers['etag'] || '';
                        const modTime = headers['last-modified'] || '';

                        if ((!etag || !row.etag || (etag !== row.etag))
                            && (!modTime || !row.modTime || (modTime !== row.modTime))
                            ) {
                            const downdata = await this.down.load(row.id);

                            size = downdata.length;
                            hash = await utils.getBufHash(downdata, 'sha256', 'hex');
                            unchanged = false;
                        }

                        await db.update({
                            table: 'buc',
                            mod: `(r) => {
                                r.checkTime = ${db.esc(Date.now())};
                                r.etag = ${(unchanged ? 'r.etag' : db.esc(etag))};
                                r.modTime = ${(unchanged ? 'r.modTime' : db.esc(modTime))};
                                r.size = ${(unchanged ? 'r.size' : db.esc(size))};
                                r.checkSum = ${(unchanged ? 'r.checkSum' : db.esc(hash))};
                                r.state = 0;
                                r.error = '';
                            }`,
                            where: `@@id(${db.esc(row.id)})`
                        });

                        if (unchanged) {
                            log(`checked ${row.id} > unchanged`);
                        } else {
                            log(`checked ${row.id} > size ${size}`);
                        }
                    } catch (e) {
                        await db.update({
                            table: 'buc',
                            mod: `(r) => {
                                r.checkTime = ${db.esc(Date.now())};
                                r.state = 0;
                                r.error = ${db.esc(e.message)};
                            }`,
                            where: `@@id(${db.esc(row.id)})`
                        });

                        log(LM_ERR, `error ${row.id} > ${e.stack}`);
                    } finally {
                        (async() => {
                            await utils.sleep(this.sameHostCheckInterval);
                            this.hostChecking[url.hostname] = false;
                        })();
                    }
                } else {
                    this.checkQueue.push(row);
                }
            } catch(e) {
                log(LM_ERR, e.stack);
            }

            await utils.sleep(10);
        }
    }

    async main() {
        try {
            //обнуляем все статусы
            await this.db.update({table: 'buc', mod: `(r) => r.state = 0`});

            this.fillCheckQueue();//no await

            //10 потоков
            for (let i = 0; i < 10; i++)
                this.periodicCheck();//no await

            log(`------------------`);
            log(`BUC Server started`);
            log(`------------------`);
        } catch (e) {
            log(LM_FATAL, e.stack);
            ayncExit.exit(1);
        }
    }
}

module.exports = BUCServer;
