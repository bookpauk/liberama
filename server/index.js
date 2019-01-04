const config = require('./config');

const {initLogger, getLog} = require('./core/getLogger');
initLogger(config);
const log = getLog();

const express = require('express');
const compression = require('compression');
const app = express();

const SqliteConnectionPool = require('./core/SqliteConnectionPool');

async function main() {
    const connPool = new SqliteConnectionPool(20, config);
    
    log('Opening database');
    await connPool.init();

    app.use(express.json());

    if (config.branch == 'development') {
        const devFileName = './dev.js'; //ignored by pkg
        require(devFileName).webpackDevMiddleware(app);
    }

    app.use(compression({ level: 1 }));
    app.use(express.static(config.publicDir, { maxAge: '30d' }));

    require('./routes').initRoutes(app, connPool, config);

    app.use(function(err, req, res, next) {
        log(LM_ERR, err.stack);
        if (config.branch == 'development') {
            res.status(500).send(err.stack);
        } else {
            res.sendStatus(500);
        }
    });

    app.listen(config.port, config.ip, function() {
        log('Server is ready');
    });
}

main();