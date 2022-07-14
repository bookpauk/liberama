require('tls').DEFAULT_MIN_VERSION = 'TLSv1';
const fs = require('fs-extra');
const path = require('path');
const argv = require('minimist')(process.argv.slice(2));
const express = require('express');
const compression = require('compression');
const http = require('http');
const WebSocket = require ('ws');

const ayncExit = new (require('./core/AsyncExit'))();

let log = null;

const maxPayloadSize = 50;//in MB

async function init() {
    //config
    const configManager = new (require('./config'))();//singleton
    await configManager.init();
    configManager.userConfigFile = argv.config;
    await configManager.load();
    const config = configManager.config;

    //logger
    const appLogger = new (require('./core/AppLogger'))();//singleton
    await appLogger.init(config);
    log = appLogger.log;

    //dirs
    log(`${config.name} v${config.version}, Node.js ${process.version}`);
    log('Initializing');

    await fs.ensureDir(config.dataDir);
    await fs.ensureDir(config.uploadDir);
    await fs.ensureDir(config.sharedDir);

    await fs.ensureDir(config.tempDir);
    await fs.emptyDir(config.tempDir);

    const appDir = `${config.publicDir}/app`;
    const appNewDir = `${config.publicDir}/app_new`;
    if (await fs.pathExists(appNewDir)) {
        await fs.remove(appDir);
        await fs.move(appNewDir, appDir);
    }

    //connections
    const connManager = new (require('./db/ConnManager'))();//singleton
    await connManager.init(config);

    const jembaConnManager = new (require('./db/JembaConnManager'))();//singleton
    await jembaConnManager.init(config, argv['auto-repair']);

    //converter SQLITE => JembaDb
    const converter = new  (require('./db/Converter'))();
    await converter.run(config);
}

async function main() {
    const log = new (require('./core/AppLogger'))().log;//singleton
    const config = new (require('./config'))().config;//singleton

    //servers
    for (let serverCfg of config.servers) {
        if (serverCfg.mode !== 'none') {
            const app = express();
            const server = http.createServer(app);
            const wss = new WebSocket.Server({ server, maxPayload: maxPayloadSize*1024*1024 });

            const serverConfig = Object.assign({}, config, serverCfg);

            let devModule = undefined;
            if (serverConfig.branch == 'development') {
                const devFileName = './dev.js'; //require ignored by pkg -50Mb executable size
                devModule = require(devFileName);
                devModule.webpackDevMiddleware(app);
            }

            app.use(compression({ level: 1 }));
            app.use(express.json({limit: `${maxPayloadSize}mb`}));
            if (devModule)
                devModule.logQueries(app);

            app.use(express.static(serverConfig.publicDir, {
                maxAge: '30d',
                setHeaders: (res, filePath) => {
                    if (path.basename(path.dirname(filePath)) == 'tmp') {
                        res.set('Content-Type', 'application/xml');
                        res.set('Content-Encoding', 'gzip');
                    }
                }               
            }));

            require('./routes').initRoutes(app, wss, serverConfig);

            if (devModule) {
                devModule.logErrors(app);
            } else {
                app.use(function(err, req, res, next) {// eslint-disable-line no-unused-vars
                    log(LM_ERR, err.stack);
                    res.sendStatus(500);
                });
            }

            server.listen(serverConfig.port, serverConfig.ip, function() {
                log(`Server-${serverConfig.serverName} is ready on ${serverConfig.ip}:${serverConfig.port}, mode: ${serverConfig.mode}`);
            });
        }
    }
}

(async() => {
    try {
        await init();
        await main();
    } catch (e) {
        if (log)
            log(LM_FATAL, e.stack);
        else
            console.error(e.stack);
        ayncExit.exit(1);
    }
})();
