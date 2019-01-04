const path = require('path');
const base = require('./base');

const execPath = path.dirname(process.execPath);
const dataDir = `${execDir}/data`;

module.exports = Object.assign({}, base, {
        branch: 'production',
        dataDir: dataDir,
        tempDir: `${dataDir}/tmp`,
        logDir: `${dataDir}/log`,
        publicDir: `${execDir}/public`,
    }
);
