const fs = require('fs-extra');

const SqliteConnectionPool = require('./SqliteConnectionPool');
const log = require('../core/getLogger').getLog();

const migrations = {
    'app': require('./migrations/app'),
    'readerStorage': require('./migrations/readerStorage'),
};

class ConnManager {
    constructor() {
        this._pool = {};
    }

    async init(config) {
        this.config = config;

        const force = null;//(config.branch == 'development' ? 'last' : null);

        for (const poolConfig of this.config.db) {
            const dbFileName = this.config.dataDir + '/' + poolConfig.fileName;

            //бэкап
            await fs.copy(dbFileName, `${dbFileName}.bak`);

            const connPool = new SqliteConnectionPool();
            await connPool.open(poolConfig.connCount, dbFileName);

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
    }

    get pool() {
        return this._pool;
    }
}

const connManager = new ConnManager();

module.exports = connManager;