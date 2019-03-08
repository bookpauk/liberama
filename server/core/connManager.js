const SqliteConnectionPool = require('./SqliteConnectionPool');

class ConnManager {
    constructor() {
        this._pool = {};
    }

    async init(config) {
        this.config = config;
        for (const poolConfig of this.config.db) {
            const dbFileName = this.config.dataDir + '/' + poolConfig.fileName;
            const connPool = new SqliteConnectionPool();
            await connPool.open(poolConfig.connCount, dbFileName);

            this._pool[poolConfig.poolName] = connPool;
        }
    }

    get pool() {
        return this._pool;
    }
}

const connManager = new ConnManager();

module.exports = connManager;