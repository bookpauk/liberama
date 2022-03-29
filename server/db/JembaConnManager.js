const fs = require('fs-extra');
const _ = require('lodash');

const ayncExit = new (require('../core/AsyncExit'))();//singleton
const { JembaDb, JembaDbThread } = require('jembadb');
const log = new (require('../core/AppLogger'))().log;//singleton

const jembaMigrations = require('./jembaMigrations');

let instance = null;

//singleton
class JembaConnManager {
    constructor() {
        if (!instance) {
            this.inited = false;
            this._db = {};

            instance = this;
        }

        return instance;
    }

    async init(config, forceAutoRepair = false, migs = jembaMigrations, undoLastMigration = false) {
        if (this.inited)
            throw new Error('JembaConnManager initialized already');

        this.config = config;
        this._db = {};

        ayncExit.add(this.close.bind(this));

        for (const dbConfig of this.config.jembaDb) {
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
            this._db[dbConfig.dbName] = dbConn;

            log(`Open "${dbConfig.dbName}" begin`);
            await dbConn.lock({
                dbPath,
                create: true,
                softLock: true,

                tableDefaults: {
                    cacheSize: dbConfig.cacheSize,
                    compressed: dbConfig.compressed,
                    forceFileClosing: dbConfig.forceFileClosing,
                    typeCompatMode: true,
                },
            });

            if (dbConfig.openAll || forceAutoRepair || dbConfig.autoRepair) {
                try {
                    await dbConn.openAll();
                } catch(e) {
                    if ((forceAutoRepair || dbConfig.autoRepair) && 
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

            log(`Open "${dbConfig.dbName}" end`);

            //миграции
            const mig = migs[dbConfig.dbName];
            if (mig && mig.data) {
                const applied = await this.migrate(dbConn, mig.data, mig.table, undoLastMigration);
                if (applied.length)
                    log(`${applied.length} migrations applied to "${dbConfig.dbName}"`);
            }
        }

        this.inited = true;
    }

    async close() {
        for (const dbConfig of this.config.jembaDb) {
            if (this._db[dbConfig.dbName])
                await this._db[dbConfig.dbName].unlock();
        }

        this._db = {};
        this.inited = false;
    }

    async migrate(db, migs, table, undoLastMigration) {
        const migrations = _.cloneDeep(migs).sort((a, b) => a.id - b.id);

        if (!migrations.length) {
            throw new Error('No migration data');
        }

        migrations.map(migration => {
            const data = migration.data;
            if (!data.up || !data.down) {
                throw new Error(`The ${migration.id}:${migration.name} does not contain 'up' or 'down' instructions`);
            } else {
                migration.up = data.up;
                migration.down = data.down;
            }
            delete migration.data;
        });

        // Create a database table for migrations meta data if it doesn't exist
        // id, name, up, down
        await db.create({
            table, 
            quietIfExists: true,
        });

        // Get the list of already applied migrations
        let dbMigrations = await db.select({
            table,
            sort: '(a, b) => a.id - b.id'
        });

        const execUpDown = async(items) => {
            for (const item of items) {
                const action = item[0];
                await db[action](item[1]);
            }
        };

        // Undo migrations that exist only in the database but not in migs,
        // also undo the last migration if the undoLastMigration
        const lastMigration = migrations[migrations.length - 1];
        for (const migration of dbMigrations.slice().sort((a, b) => b.id - a.id)) {
            if (!migrations.some(x => x.id === migration.id) ||
                (undoLastMigration && migration.id === lastMigration.id)) {
                    await execUpDown(migration.down);
                    await db.delete({
                        table, 
                        where: `@@id(${db.esc(migration.id)})`
                    });
                    dbMigrations = dbMigrations.filter(x => x.id !== migration.id);
            } else {
                break;
            }
        }

        // Apply pending migrations
        let applied = [];
        const lastMigrationId = dbMigrations.length ? dbMigrations[dbMigrations.length - 1].id : 0;
        for (const migration of migrations) {
            if (migration.id > lastMigrationId) {
                await execUpDown(migration.up);
                await db.insert({
                    table,
                    rows: [migration],
                });
                applied.push(migration.id);
            }
        }

        return applied;
    }

    get db() {
        if (!this.inited)
            throw new Error('JembaConnManager not inited');

        return this._db;
    }
}

module.exports = JembaConnManager;