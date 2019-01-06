const log = require('./core/getLogger').getLog();

function webpackDevMiddleware(app) {
    const webpack  = require('webpack');
    const wpConfig = require('../build/webpack.dev.config');

    const compiler = webpack(wpConfig);
    const devMiddleware = require('webpack-dev-middleware');
    app.use(devMiddleware(compiler, {
        publicPath: wpConfig.output.publicPath,
        stats: {colors: true}
    }));

    let hotMiddleware = require('webpack-hot-middleware');
    app.use(hotMiddleware(compiler, {
        log: log
    }));
}

function logQueries(app) {
    app.use(function(req, res, next) {
        const start = Date.now();
        log(`${req.method} ${req.originalUrl} ${JSON.stringify(req.body)}`);
        res.once('finish', () => {
            log(`${Date.now() - start}ms`);
        });
        next();
    });
}

function logErrors(app) {
    app.use(function(err, req, res, next) {// eslint-disable-line no-unused-vars
        log(LM_ERR, err.stack);
        res.status(500).send(err.stack);
    });    
}

module.exports = {
    webpackDevMiddleware,
    logQueries,
    logErrors
};