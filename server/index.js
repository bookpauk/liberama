const express = require('express');
const app = express();

const config = require('./config/config');
const logger = require('./core/loggerInit')(config);

const SqliteConnectionPool = require('./core/SqliteConnectionPool');

async function main() {
    const connPool = new SqliteConnectionPool(20, config);
    
    logger.log('Opening database');
    await connPool.init();

    app.use(express.static('public'));
    app.use(express.json());

    require('./routes')(app, connPool, logger, config);

    app.listen(config.port, config.ip, function() {
        logger.log('Server is ready');
    });
}

main();