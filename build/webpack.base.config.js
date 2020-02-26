const path = require('path');
//const webpack = require('webpack');
const VueLoaderPlugin = require('vue-loader/lib/plugin');

const clientDir = path.resolve(__dirname, '../client');

module.exports = {
    entry: [`${clientDir}/main.js`],
    output: {
        publicPath: '/app/',
    },

    module: {
        rules: [
            {
                test: /\.vue$/,
                loader: "vue-loader"
            },
            {
                test: /\.includer$/,
                resourceQuery: /^\?vue/,
                use: path.resolve('build/includer.js')
            },
            {
                test: /\.js$/,
                loader: 'babel-loader',
                exclude: /node_modules/,
                query: {
                    plugins: [
                        'syntax-dynamic-import',
                        'transform-decorators-legacy',
                        'transform-class-properties',
//                        ["component", { "libraryName": "element-ui", "styleLibraryName": `~${clientDir}/theme` } ]
                    ]
                }
            },
            {
                test: /\.gif$/,
                loader: "url-loader",
                options: {
                    name: "images/[name]-[hash:6].[ext]"
                }
            },
            {
                test: /\.png$/,
                loader: "url-loader",
                options: {
                    name: "images/[name]-[hash:6].[ext]"
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
                test: /\.(ttf|eot|woff|woff2)$/,
                loader: "file-loader",
                options: {
                    name: "fonts/[name]-[hash:6].[ext]"
                }
            },
        ]
    },

    plugins: [
        new VueLoaderPlugin(),
    ]
};
