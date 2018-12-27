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

    if (config.branch == 'development') {
        const devFileName = './dev.js'; //ignored by pkg
        require(devFileName).webpackDevMiddleware(app);
    }

    app.use(express.static(config.publicDir));
    app.use(express.json());

    require('./routes').initRoutes(app, connPool, config);

    app.listen(config.port, config.ip, function() {
        log('Server is ready');
    });
}

main();