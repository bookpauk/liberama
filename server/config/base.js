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
    uploadDir: `${execDir}/public/upload`,
    dbFileName: 'db.sqlite',
    loggingEnabled: true,

    maxUploadFileSize: 50*1024*1024,//50Мб
    maxTempPublicDirSize: 512*1024*1024,//512Мб
    maxUploadPublicDirSize: 200*1024*1024,//100Мб

    servers: [
        {
            serverName: '1',
            mode: 'normal', //'none', 'normal', 'site', 'reader', 'omnireader'
            ip: '0.0.0.0',
            port: '33080',
        },
    ],

};

