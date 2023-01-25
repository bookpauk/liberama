const _ = require('lodash');

const utils = require('../utils');
const JembaConnManager = require('../../db/JembaConnManager');//singleton
const log = new (require('../AppLogger'))().log;//singleton

let instance = null;

//singleton
class JembaReaderStorage {
    constructor() {
        if (!instance) {
            this.connManager = new JembaConnManager();
            this.db = this.connManager.db['reader-storage'];

            this.cacheMap = new Map();
            this.periodicCleanCache(3*3600*1000);//1 раз в 3 часа

            instance = this;
        }

        return instance;
    }

    getCache(id) {
        const obj = this.cacheMap.get(id);
        //обновляем время доступа и при чтении тоже
        if (obj)
            obj.time = Date.now();
        return obj;
    }

    setCache(id, newObj) {
        let obj = this.cacheMap.get(id);
        if (!obj)
            obj = {};
        Object.assign(obj, newObj, {time: Date.now()});
        this.cacheMap.set(id, obj);
    }

    async doAction(act) {
        try {
            if (!_.isObject(act.items))
                throw new Error('items is not an object');

            let result = {};
            switch (act.action) {
                case 'check':
                    result = await this.checkItems(act.items);
                    break;
                case 'get':
                    result = await this.getItems(act.items);
                    break;
                case 'set':
                    result = await this.setItems(act.items, act.identity, act.force);
                    break;
                default:
                    throw new Error('Unknown action');
            }

            return result;
        } catch (e) {
            log(LM_ERR, `JembaReaderStorage: ${e.message}`);
            throw e;
        }
    }

    async checkItems(items) {
        let result = {state: 'success', items: {}};

        const db = this.db;

        for (const id of Object.keys(items)) {
            const obj = this.getCache(id);
            if (obj && obj.items) {
                result.items[id] = obj.items;
            } else {
                const rows = await db.select({//SQL`SELECT rev FROM storage WHERE id = ${id}`
                    table: 'storage',
                    map: '(r) => ({rev: r.rev})',
                    where: `@@id(${db.esc(id)})`
                });
                const rev = (rows.length && rows[0].rev ? rows[0].rev : 0);
                result.items[id] = {rev};

                this.setCache(id, {items: result.items[id]});
            }
        }

        return result;
    }

    async getItems(items) {
        let result = {state: 'success', items: {}};

        const db = this.db;

        for (const id of Object.keys(items)) {
            const rows = await db.select({//SQL`SELECT rev, data FROM storage WHERE id = ${id}`);
                table: 'storage',
                where: `@@id(${db.esc(id)})`
            });
            const rev = (rows.length && rows[0].rev ? rows[0].rev : 0);
            const data = (rows.length && rows[0].data ? rows[0].data : '');
            result.items[id] = {rev, data};
        }

        return result;
    }

    async setItems(items, identity, force) {
        let check = await this.checkItems(items);

        //сначала проверим совпадение ревизий
        for (const id of Object.keys(items)) {
            if (!_.isString(items[id].data))
                throw new Error('items.data is not a string');

            //identity необходимо для работы при нестабильной связи,
            //одному и тому же клиенту разрешается перезаписывать данные при расхождении на 0 или 1 ревизию
            const obj = this.getCache(id) || {};
            const oldIdentity = obj.identity;
            const sameClient = (identity && obj.identity === identity);
            if (identity && obj.identity !== identity) {
                obj.identity = identity;
                this.setCache(id, obj);
            }

            const revDiff = items[id].rev - check.items[id].rev;
            const allowUpdate = force || revDiff === 1 || (sameClient && (revDiff === 0 || revDiff === 1));

            if (!allowUpdate) {
                log(LM_ERR, `JembaReaderStorage-Reject: revDiff: ${revDiff}, sameClient: ${sameClient}, oldIdentity: ${oldIdentity}, identity: ${identity}`);

                return {state: 'reject', items: check.items};
            }
        }

        const db = this.db;
        for (const id of Object.keys(items)) {
            await db.insert({//SQL`INSERT OR REPLACE INTO storage (id, rev, time, data) VALUES (${id}, ${items[id].rev}, strftime('%s','now'), ${items[id].data})`);
                table: 'storage',
                replace: true,
                rows: [{id, rev: items[id].rev, time: utils.toUnixTime(Date.now()), data: items[id].data}],
            });
            this.setCache(id, {items: {rev: items[id].rev}});
        }
        
        return {state: 'success'};
    }

    periodicCleanCache(timeout) {
        try {
            const sorted = [];
            for (const [id, obj] of this.cacheMap)
                sorted.push({id, time: obj.time});

            sorted.sort((a, b) => b.time - a.time);

            for (const obj of sorted) {
                //оставляем только 1000 недавних
                if (this.cacheMap.size <= 1000)
                    break;

                this.cacheMap.delete(obj.id);
            }
        } finally {
            setTimeout(() => {
                this.periodicCleanCache(timeout);
            }, timeout);
        }
    }
}

module.exports = JembaReaderStorage;