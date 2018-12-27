const path = require("path");
const webpack = require("webpack");
const VueLoaderPlugin = require('vue-loader/lib/plugin');

module.exports = {
    entry: [path.resolve(__dirname, "../client/main.js")],
    output: {
        path: path.resolve(__dirname, "..", "server", "public"),
        publicPath: "/",
        filename: "bundle.js"
    },

    module: {
        rules: [
            // это будет применяться к файлам `.js`
            // А ТАКЖЕ к секциям `<script>` внутри файлов `.vue`
            {
            test: /\.js$/,
            loader: 'babel-loader'
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
            {
                test: /\.gif$/,
                loader: "url-loader",
                options: {
                    name: "images/[name]-[hash:6].[ext]",
                    limit: 10000
                }
            },
            {
                test: /\.png$/,
                loader: "url-loader",
                options: {
                    name: "images/[name]-[hash:6].[ext]",
                    limit: 10000
                }
            },
            {
                test: /\.jpg$/,
                loader: "file-loader",
                options: {
                    name: "images/[name]-[hash:6].[ext]"
                }
            },
        ]
    },

    plugins: [
        new VueLoaderPlugin()
    ]
};
