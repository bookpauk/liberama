let path = require("path");
let webpack = require("webpack");

let merge = require("webpack-merge");
let baseWpConfig = require("./webpack.base.config");

baseWpConfig.entry.unshift("webpack-hot-middleware/client");

module.exports = merge(baseWpConfig, {
    mode: 'none',
    devtool: "#inline-source-map",

    module: {
        rules: [
            {
                test: /\.vue$/,
                loader: "vue-loader"
            }
        ]
    },

    plugins: [
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NoEmitOnErrorsPlugin()
    ]
});
