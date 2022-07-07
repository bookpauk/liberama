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
            this.periodicCleanCache(3*3600*1000);//1 раз в 3 часа

            instance = this;
        }

        return instance;
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
                    result = await this.setItems(act.items, act.force);
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
            if (this.cache[id]) {
                result.items[id] = this.cache[id];
            } else {
                const rows = await db.select({//SQL`SELECT rev FROM storage WHERE id = ${id}`
                    table: 'storage',
                    map: '(r) => ({rev: r.rev})',
                    where: `@@id(${db.esc(id)})`
                });
                const rev = (rows.length && rows[0].rev ? rows[0].rev : 0);
                result.items[id] = {rev};
                this.cache[id] = result.items[id];
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

    async setItems(items, force) {
        let check = await this.checkItems(items);

        //сначала проверим совпадение ревизий
        for (const id of Object.keys(items)) {
            if (!_.isString(items[id].data))
                throw new Error('items.data is not a string');

            if (!force && check.items[id].rev + 1 !== items[id].rev)
                return {state: 'reject', items: check.items};
        }

        const db = this.db;
        const newRev = {};
        for (const id of Object.keys(items)) {
            await db.insert({//SQL`INSERT OR REPLACE INTO storage (id, rev, time, data) VALUES (${id}, ${items[id].rev}, strftime('%s','now'), ${items[id].data})`);
                table: 'storage',
                replace: true,
                rows: [{id, rev: items[id].rev, time: utils.toUnixTime(Date.now()), data: items[id].data}],
            });
            newRev[id] = {rev: items[id].rev};
        }
        
        Object.assign(this.cache, newRev);

        return {state: 'success'};
    }

    periodicCleanCache(timeout) {
        this.cache = {};

        setTimeout(() => {
            this.periodicCleanCache(timeout);
        }, timeout);
    }
}

module.exports = JembaReaderStorage;