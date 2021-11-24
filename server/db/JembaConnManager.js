const fs = require('fs-extra');

const ayncExit = new (require('../core/AsyncExit'))();//singleton
const { JembaDb, JembaDbThread } = require('./JembaDb');
const log = new (require('../core/AppLogger'))().log;//singleton

let instance = null;

//singleton
class JembaConnManager {
    constructor() {
        if (!instance) {
            this.inited = false;

            instance = this;
        }

        return instance;
    }

    async init(config) {
        if (this.inited)
            throw new Error('JembaConnManager initialized already');

        this.config = config;
        this._db = {};

        for (const dbConfig of this.config.db) {
            const dbPath = `${this.config.dataDir}/db/${dbConfig.dbName}`;

            //бэкап
            if (!dbConfig.noBak && await fs.pathExists(dbPath)) {
                const bakFile = `${dbPath}.bak`;
                await fs.remove(bakFile);
                await fs.copy(dbPath, bakFile);
            }

            let dbConn = null;
            if (dbConfig.thread) {
                dbConn = new JembaDbThread();
            } else {
                dbConn = new JembaDb();
            }

            log(`Open "${dbConfig.dbName}" start`);
            await dbConn.openDb({dbPath, cacheSize: dbConfig.cacheSize, compressed: dbConfig.compressed, forceFileClosing: true});
            ayncExit.add(dbConn.closeDb.bind(dbConn));

            if (dbConfig.openAll) {
                try {
                    await dbConn.openAll();
                } catch(e) {
                    if (dbConfig.autoRepair && 
                        (
                            e.message.indexOf('corrupted') >= 0 
                            || e.message.indexOf('Unexpected token') >= 0
                            || e.message.indexOf('invalid stored block lengths') >= 0
                        )
                        ) {
                        log(LM_ERR, e);
                        log(`Open "${dbConfig.dbName}" with auto repair`);
                        await dbConn.openAll({autoRepair: true});
                    } else {
                        throw e;
                    }
                }
            }

            log(`Open "${dbConfig.dbName}" finish`);

            //миграции
            /*const migs = migrations[dbConfig.poolName];
            if (migs && migs.data.length) {
                const applied = await connPool.migrate(migs.data, migs.table, force);
                if (applied.length)
                    log(`${applied.length} migrations applied to "${dbConfig.poolName}"`);
            }*/

            this._db[dbConfig.dbName] = dbConn;
        }
        this.inited = true;
    }

    get db() {
        return this._db;
    }
}

module.exports = JembaConnManager;