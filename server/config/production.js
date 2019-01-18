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

        servers: [
            {
                serverName: '1',
                mode: 'normal', //'none', 'normal', 'site', 'reader', 'omnireader'
                ip: '0.0.0.0',
                port: '44080',
            },
            {
                serverName: '2',
                mode: 'omnireader',
                ip: '0.0.0.0',
                port: '44081',
            },
        ],

    }
);
