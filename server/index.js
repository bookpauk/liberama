const config = require('./config');

const {initLogger, getLog} = require('./core/getLogger');
initLogger(config);
const log = getLog();

const fs = require('fs-extra');
const path = require('path');
const express = require('express');
const compression = require('compression');

const SqliteConnectionPool = require('./core/SqliteConnectionPool');

async function init() {
    await fs.ensureDir(config.dataDir);
    await fs.ensureDir(config.tempDir);
    await fs.emptyDir(config.tempDir);
}

async function main() {
    const connPool = new SqliteConnectionPool(20, config);
    
    log('Initializing');
    await init();

    log('Opening database');
    await connPool.init();

    //servers
    for (let server of config.servers) {
        if (server.mode !== 'none') {
            const app = express();
            const serverConfig = Object.assign({}, config, server);

            let devModule = undefined;
            if (serverConfig.branch == 'development') {
                const devFileName = './dev.js'; //ignored by pkg -50Mb executable size
                devModule = require(devFileName);
                devModule.webpackDevMiddleware(app);
            }

            app.use(compression({ level: 1 }));
            app.use(express.json());
            if (devModule)
                devModule.logQueries(app);

            app.use(express.static(serverConfig.publicDir, {
                maxAge: '30d',
                setHeaders: (res, filePath) => {
                    if (path.basename(path.dirname(filePath)) == 'tmp') {
                        res.set('Content-Type', 'text/xml');
                        res.set('Content-Encoding', 'gzip');
                    }
                }               
            }));

            require('./routes').initRoutes(app, connPool, serverConfig);

            if (devModule) {
                devModule.logErrors(app);
            } else {
                app.use(function(err, req, res, next) {// eslint-disable-line no-unused-vars
                    log(LM_ERR, err.stack);
                    res.sendStatus(500);
                });
            }

            app.listen(serverConfig.port, serverConfig.ip, function() {
                log(`Server-${serverConfig.serverName} is ready on ${serverConfig.ip}:${serverConfig.port}, mode: ${serverConfig.mode}`);
            });
        }
    }
}

main();