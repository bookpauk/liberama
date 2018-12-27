const path = require('path');
const pckg = require('../../package.json');
const execPath = path.resolve(__dirname, '..');

module.exports = {
    branch: 'base',
    tempDir: execPath + '/tmp',
    logDir: execPath + '/log',
    dataDir: execPath + '/data',
    publicDir: execPath + '/public',
    dbFileName: 'db.sqlite',
    loggingEnabled: true,

    port: '33080',
    ip: '127.0.0.1',

    version: pckg.version,
    name: pckg.name,
};

