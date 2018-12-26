const utils = require('./utils');
const Logger = require('./Logger');

module.exports = function(config) {
    let loggerParams = null;

    if (config.loggingEnabled) {
        utils.mkDirIfNotExistsSync(config.logDir);
        loggerParams = [
            {log: 'ConsoleLog'},
            {log: 'FileLog', fileName: `${config.logDir}/${config.name}.log`},
        ];
    }

    return new Logger(loggerParams);
}