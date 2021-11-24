//TODO: удалить модуль в 2023г
const fs = require('fs-extra');

const SqliteConnectionPool = require('./SqliteConnectionPool');
const log = new (require('../core/AppLogger'))().log;//singleton

const migrations = {
    'app': require('./migrations/app'),
    'readerStorage': require('./migrations/readerStorage'),
};

let instance = null;

//singleton
class ConnManager {
    constructor() {
        if (!instance) {
            this.inited = false;

            instance = this;
        }

        return instance;
    }

    async init(config) {
        this.config = config;
        this._pool = {};

        const force = null;//(config.branch == 'development' ? 'last' : null);

        for (const poolConfig of this.config.db) {
            const dbFileName = this.config.dataDir + '/' + poolConfig.fileName;

            //бэкап
            if (!poolConfig.noBak && await fs.pathExists(dbFileName))
                await fs.copy(dbFileName, `${dbFileName}.bak`);

            const connPool = new SqliteConnectionPool();
            await connPool.open(poolConfig, dbFileName);

            log(`Opened database "${poolConfig.poolName}"`);
            //миграции
            const migs = migrations[poolConfig.poolName];
            if (migs && migs.data.length) {
                const applied = await connPool.migrate(migs.data, migs.table, force);
                if (applied.length)
                    log(`${applied.length} migrations applied to "${poolConfig.poolName}"`);
            }

            this._pool[poolConfig.poolName] = connPool;
        }
        this.inited = true;
    }

    get pool() {
        return this._pool;
    }
}

module.exports = ConnManager;