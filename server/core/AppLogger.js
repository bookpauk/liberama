const fs = require('fs-extra');
const Logger = require('./Logger');

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

    async init(config) {
        if (this.inited)
            throw new Error('already inited');

        let loggerParams = null;

        if (config.loggingEnabled) {
            await fs.ensureDir(config.logDir);
            loggerParams = [
                {log: 'ConsoleLog'},
                {log: 'FileLog', fileName: `${config.logDir}/${config.name}.log`},
                {log: 'FileLog', fileName: `${config.logDir}/${config.name}.err.log`, exclude: [LM_OK, LM_INFO]},
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
