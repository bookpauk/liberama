const path = require('path');
const base = require('./base');

const execPath = path.dirname(process.execPath);

module.exports = Object.assign({}, base, {
        branch: 'production',
        tempDir: execPath + '/tmp',
        logDir: execPath + '/log',
        dataDir: execPath + '/data',
        publicDir: execPath + '/public',
    }
);
