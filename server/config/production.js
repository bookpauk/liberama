const path = require('path');
const base = require('./base');

const execDir = path.dirname(process.execPath);
const dataDir = `${execDir}/data`;

module.exports = Object.assign({}, base, {
    branch: 'production',
    dataDir: dataDir,
    tempDir: `${dataDir}/tmp`,
    logDir: `${dataDir}/log`,
    publicDir: `${execDir}/public`,
    uploadDir: `${execDir}/public/upload`,
    sharedDir: `${execDir}/public/shared`,

    servers: [
        {
            serverName: '1',
            mode: 'normal', //'none', 'normal', 'site', 'reader', 'omnireader'
            ip: '0.0.0.0',
            port: '44080',
        },
    ],

});
