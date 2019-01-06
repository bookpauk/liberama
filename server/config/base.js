const path = require('path');
const pckg = require('../../package.json');

const execDir = path.resolve(__dirname, '..');
const dataDir = `${execDir}/data`;

module.exports = {
    branch: 'unknown',
    version: pckg.version,
    name: pckg.name,

    dataDir: dataDir,
    tempDir: `${dataDir}/tmp`,
    logDir: `${dataDir}/log`,
    publicDir: `${execDir}/public`,
    dbFileName: 'db.sqlite',
    loggingEnabled: true,

    servers: [
        {
            name: '1',
            mode: 'normal', //none, normal, site, reader, omnireader
            ip: '127.0.0.1',
            port: '33080',
        },
        {
            name: '2',
            mode: 'omnireader', //none, normal, site, reader, omnireader
            ip: '0.0.0.0',
            port: '33081',
        },
    ],

};

