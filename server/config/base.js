const path = require('path');
const fs = require('fs');

const packageObj = JSON.parse(fs.readFileSync(__dirname + '/../../package.json', 'utf8'));
const execPath = path.dirname(process.execPath);

module.exports = {
    branch: 'base',
    tempDir: execPath +'/tmp',
    logDir: execPath + '/log',
    dataDir: execPath + '/data',
    dbFileName: 'db.sqlite',
    loggingEnabled: true,

    port: '33080',
    ip: '127.0.0.1',

    version: packageObj.version,
    name: packageObj.name,
};

