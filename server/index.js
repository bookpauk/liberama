const express = require('express');
const app = express();

const config = require('./config/config');
const logger = require('./core/loggerInit')(config);

const SqliteConnectionPool = require('./core/SqliteConnectionPool');

async function main() {
    const connPool = new SqliteConnectionPool(20, logger, config);
    await connPool.init();

    app.use(app.json());
    app.static('public');

    require('./routes')(app, connPool, logger, config);

    app.listen(config.port, config.ip, function() {
        logger.log('Server is ready');
    });
}

main();