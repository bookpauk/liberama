const config = require('./config');

const {initLogger, getLog} = require('./core/getLogger');
initLogger(config);
const log = getLog();

const express = require('express');
const app = express();

const SqliteConnectionPool = require('./core/SqliteConnectionPool');

async function main() {
    const connPool = new SqliteConnectionPool(20, config);
    
    log('Opening database');
    await connPool.init();

    app.use(express.static('public'));
    app.use(express.json());

    require('./routes').initRoutes(app, connPool, config);

    app.listen(config.port, config.ip, function() {
        log('Server is ready');
    });
}

main();