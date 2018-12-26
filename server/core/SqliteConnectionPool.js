const Promise = require('bluebird');
const utils = require('./utils');
const sqlite = require('sqlite');

const waitingDelay = 100; //ms

class SqliteConnectionPool {
    constructor(connCount, logger, config) {
        this.connCount = connCount;
        this.logger = logger;
        this.config = config;
    }

    async init() {
        this.logger.log('Opening database');

        utils.mkDirIfNotExistsSync(this.config.dataDir);
        const dbFileName = this.config.dataDir + '/' + this.config.dbFileName;

        this.connections = [];
        this.taken = new Set();
        this.freed = new Set();

        for (let i = 0; i < this.connCount; i++) {

            let client = await sqlite.open(dbFileName);
            client.configure('busyTimeout', 10000); //ms

            client.ret = () => {
                this.taken.delete(i);
                this.freed.add(i);
            };

            this.freed.add(i);
            this.connections[i] = client;
        }
    }

    _setImmediate() {
        return new Promise((resolve) => {
            setImmediate(() => {
                return resolve();
            });
        });
    }

    async get() {
        if (this.closed)
            return;

        let freeConnIndex = this.freed.values().next().value;
        if (freeConnIndex == null) {
            if (waitingDelay)
                await utils.sleep(waitingDelay);
            return await this._setImmediate().then(() => this.get());
        }

        this.freed.delete(freeConnIndex);
        this.taken.add(freeConnIndex);

        return this.connections[freeConnIndex];
    }

    async run(query) {
        const dbh = await this.get();
        try {
            let result = await dbh.run(query);
            dbh.ret();
            return result;
        } catch (e) {
            dbh.ret();
            throw e;
        }
    }

    async all(query) {
        const dbh = await this.get();
        try {
            let result = await dbh.all(query);
            dbh.ret();
            return result;
        } catch (e) {
            dbh.ret();
            throw e;
        }
    }

    async close() {
        for (let i = 0; i < this.connections.length; i++) {
            await this.connections[i].close();
        }
        this.closed = true;
    }
}

module.exports = SqliteConnectionPool;