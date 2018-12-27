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

module.exports = {
    webpackDevMiddleware
};