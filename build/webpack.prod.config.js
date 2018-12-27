let path = require("path");
let webpack = require("webpack");

let merge = require("webpack-merge");
let baseWpConfig = require("./webpack.base.config");

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
