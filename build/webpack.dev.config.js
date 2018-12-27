const path = require("path");
const webpack = require("webpack");

const merge = require("webpack-merge");
const baseWpConfig = require("./webpack.base.config");

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
