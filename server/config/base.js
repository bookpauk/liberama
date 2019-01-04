const path = require('path');
const pckg = require('../../package.json');

const execDir = path.resolve(__dirname, '..');
const dataDir = `${execDir}/data`;

module.exports = {
    branch: 'base',
    dataDir: dataDir,
    tempDir: `${dataDir}/tmp`,
    logDir: `${dataDir}/log`,
    publicDir: `${execDir}/public`,
    dbFileName: 'db.sqlite',
    loggingEnabled: true,

    port: '33080',
    ip: '0.0.0.0',

    version: pckg.version,
    name: pckg.name,
};

