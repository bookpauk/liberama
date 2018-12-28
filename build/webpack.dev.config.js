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
            },
            // это будет применяться к файлам `.css`
            // А ТАКЖЕ к секциям `<style>` внутри файлов `.vue`
            {
                test: /\.css$/,
                use: [
                  'vue-style-loader',
                  'css-loader'
                ]
            },
        ]
    },

    plugins: [
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NoEmitOnErrorsPlugin()
    ]
});
