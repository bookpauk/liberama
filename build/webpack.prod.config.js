const path = require("path");
const webpack = require("webpack");

const merge = require("webpack-merge");
const baseWpConfig = require("./webpack.base.config");

module.exports = merge(baseWpConfig, {
    mode: 'production',
    module: {
        rules: [
            {
                test: /\.vue$/,
                loader: "vue-loader",
            }
        ]
    },
});
