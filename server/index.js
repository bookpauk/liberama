require('tls').DEFAULT_MIN_VERSION = 'TLSv1';

const fs = require('fs-extra');
const express = require('express');
const compression = require('compression');
const http = require('http');
const https = require('https');
const WebSocket = require ('ws');

const ayncExit = new (require('./core/AsyncExit'))();

let log = null;
let config;
let argv;
let branch = '';
const argvStrings = ['host', 'port', 'app-dir', 'lib-dir', 'inpx'];

const maxPayloadSize = 50;//in MB

function versionText(config) {
    return `${config.name} v${config.version}, Node.js ${process.version}`;
}

function showHelp(defaultConfig) {
    console.log(versionText(defaultConfig));
    console.log(
`Usage: ${defaultConfig.name} [options]

Options:
  --help              Print ${defaultConfig.name} command line options
  --app-dir=<dirpath> Set application working directory, default: <execDir>/.${defaultConfig.name}
  --auto-repair       Force auto repairing of corrupted database on start
`
    );
}

async function init() {
    argv = require('minimist')(process.argv.slice(2), {string: argvStrings});
    const dataDir = argv['app-dir'];

    //config
    const configManager = new (require('./config'))();//singleton
    await configManager.init(dataDir);
    const defaultConfig = configManager.config;

    await configManager.load();
    config = configManager.config;
    branch = config.branch;

    //dirs
    config.tempDir = `${config.dataDir}/tmp`;
    config.logDir = `${config.dataDir}/log`;
    config.publicDir = `${config.dataDir}/public`;
    config.publicFilesDir = `${config.dataDir}/public-files`;
    config.tempPublicDir = `${config.publicFilesDir}/tmp`;
    config.uploadPublicDir = `${config.publicFilesDir}/upload`;

    configManager.config = config;///!!!

    await fs.ensureDir(config.dataDir);
    await fs.ensureDir(config.publicDir);
    await fs.ensureDir(config.tempPublicDir);
    await fs.ensureDir(config.uploadPublicDir);

    await fs.ensureDir(config.tempDir);
    await fs.emptyDir(config.tempDir);

    //logger
    const appLogger = new (require('./core/AppLogger'))();//singleton
    await appLogger.init(config);
    log = appLogger.log;

    //cli
    if (argv.help) {
        showHelp(defaultConfig);
        ayncExit.exit(0);
    } else {
        log(versionText(config));
        log('Initializing');
    }

    //connections
    const jembaConnManager = new (require('./db/JembaConnManager'))();//singleton
    await jembaConnManager.init(config, argv['auto-repair']);

    //web app
    if (branch !== 'development') {
        //const createWebApp = require('./createWebApp');
        //await createWebApp(config);
    }
}

async function main() {
    const log = new (require('./core/AppLogger'))().log;//singleton
    const config = new (require('./config'))().config;//singleton

    //servers
    for (let serverCfg of config.servers) {
        if (serverCfg.mode !== 'none') {
            const app = express();
            let server;
            if (serverCfg.isHttps) {
                const key = fs.readFileSync(`${config.dataDir}/${serverCfg.keysFile}.key`);
                const cert = fs.readFileSync(`${config.dataDir}/${serverCfg.keysFile}.crt`);

                server = https.createServer({key, cert}, app);
            } else {
                server = http.createServer(app);
            }
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
                log(`Server "${serverConfig.serverName}" is ready on ${(serverConfig.isHttps ? 'https://' : 'http://')}${serverConfig.ip}:${serverConfig.port}, mode: ${serverConfig.mode}`);
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
