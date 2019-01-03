const path = require("path");
const webpack = require("webpack");
const VueLoaderPlugin = require('vue-loader/lib/plugin');

module.exports = {
    entry: [path.resolve(__dirname, '../client/main.js')],
    output: {
        path: path.resolve(__dirname, '../server/public/app'),
        publicPath: '/app/',
        filename: 'bundle.js'
    },

    module: {
        rules: [
            // это будет применяться к файлам `.js`
            // А ТАКЖЕ к секциям `<script>` внутри файлов `.vue`
            {
                test: /\.js$/,
                loader: 'babel-loader',
                exclude: /node_modules/,
                query: {
                    plugins: [
                        'syntax-dynamic-import',
                        'transform-decorators-legacy',
                        'transform-class-properties',
                        ["component", { "libraryName": "element-ui", "styleLibraryName": "~client/theme" } ]
                    ]
                }
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
            {
                test: /\.(ttf|eot|woff)$/,
                loader: "file-loader",
                options: {
                    prefix: "font/"
                }
            },
        ]
    },

    plugins: [
        new VueLoaderPlugin()
    ]
};
