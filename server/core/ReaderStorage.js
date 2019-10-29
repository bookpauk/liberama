const SQL = require('sql-template-strings');
const _ = require('lodash');

const ConnManager = require('../db/ConnManager');//singleton

let instance = null;

//singleton
class ReaderStorage {
    constructor() {
        if (!instance) {
            this.connManager = new ConnManager();
            this.storagePool = this.connManager.pool.readerStorage;
            this.periodicCleanCache(3*3600*1000);//1 раз в 3 часа

            instance = this;
        }

        return instance;
    }

    async doAction(act) {
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
    }

    async checkItems(items) {
        let result = {state: 'success', items: {}};

        const dbh = await this.storagePool.get();
        try {
            for (const id of Object.keys(items)) {
                if (this.cache[id]) {
                    result.items[id] = this.cache[id];
                } else {
                    const rows = await dbh.all(SQL`SELECT rev FROM storage WHERE id = ${id}`);
                    const rev = (rows.length && rows[0].rev ? rows[0].rev : 0);
                    result.items[id] = {rev};
                    this.cache[id] = result.items[id];
                }
            }
        } finally {
            dbh.ret();
        }

        return result;
    }

    async getItems(items) {
        let result = {state: 'success', items: {}};

        const dbh = await this.storagePool.get();
        try {
            for (const id of Object.keys(items)) {
                const rows = await dbh.all(SQL`SELECT rev, data FROM storage WHERE id = ${id}`);                
                const rev = (rows.length && rows[0].rev ? rows[0].rev : 0);
                const data = (rows.length && rows[0].data ? rows[0].data : '');
                result.items[id] = {rev, data};
            }
        } finally {
            dbh.ret();
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

        const dbh = await this.storagePool.get();
        await dbh.run('BEGIN');
        try {
            const newRev = {};
            for (const id of Object.keys(items)) {
                await dbh.run(SQL`INSERT OR REPLACE INTO storage (id, rev, time, data) VALUES (${id}, ${items[id].rev}, strftime('%s','now'), ${items[id].data})`);
                newRev[id] = {rev: items[id].rev};
            }
            await dbh.run('COMMIT');
            
            Object.assign(this.cache, newRev);
        } catch (e) {
            await dbh.run('ROLLBACK');
            throw e;
        } finally {
            dbh.ret();
        }

        return {state: 'success'};
    }

    periodicCleanCache(timeout) {
        this.cache = {};

        setTimeout(() => {
            this.periodicCleanCache(timeout);
        }, timeout);
    }
}

module.exports = ReaderStorage;