const path = require('path');
const base = require('./base');

const execDir = path.dirname(process.execPath);

module.exports = Object.assign({}, base, {
    branch: 'production',

    execDir,

    servers: [
        {
            serverName: '1',
            mode: 'reader',
            ip: '0.0.0.0',
            port: '44080',
        },
    ],

});
