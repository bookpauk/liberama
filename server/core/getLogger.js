const fs = require('fs-extra');
const Logger = require('./Logger');

let logger = null;

function initLogger(config) {
    if (logger)
        logger.close();

    let loggerParams = null;

    if (config.loggingEnabled) {
        fs.ensureDirSync(config.logDir);
        loggerParams = [
            {log: 'ConsoleLog'},
            {log: 'FileLog', fileName: `${config.logDir}/${config.name}.log`},
        ];
    }

    logger = new Logger(loggerParams);

    return logger;
}

function getLogger() {
    if (logger)
        return logger;
    throw new Error('getLogger error: logger not initialized');
}

function getLog() {
    const l = getLogger();
    return l.log.bind(l);
}

module.exports = {
    initLogger,
    getLogger,
    getLog,
};