const fs = require('fs-extra');
const Logger = require('./Logger');
const configManager = new (require('../config'))();//singleton

let instance = null;

//singleton
class AppLogger {
    constructor() {
        if (!instance) {
            instance = this;
        }

        this.inited = false;
        return instance;
    }

    async init() {
        if (this.inited)
            throw new Error('already inited');

        let config = configManager.config;
        let loggerParams = null;

        if (config.loggingEnabled) {
            await fs.ensureDir(config.logDir);
            loggerParams = [
                {log: 'ConsoleLog'},
                {log: 'FileLog', fileName: `${config.logDir}/${config.name}.log`},
            ];
        }

        this._logger = new Logger(loggerParams);

        this.inited = true;
        return this.logger;
    }

    get logger() {
        if (!this.inited)
            throw new Error('not inited');
        return this._logger;
    }

    get log() {
        const l = this.logger;
        return l.log.bind(l);
    }
}

module.exports = AppLogger;
