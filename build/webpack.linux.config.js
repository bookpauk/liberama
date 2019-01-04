const path = require("path");
const webpack = require("webpack");

const CleanWebpackPlugin = require('clean-webpack-plugin');
const DisableOutputWebpackPlugin = require('disable-output-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const distDir = path.resolve(__dirname, '../dist');
const outDir = `${distDir}/linux`;

module.exports = {
    mode: 'production',
    entry: `${distDir}/public/index.html`,
    output: {
        path: outDir
    },
    module: {
        rules: [
            {
                test: /\.html$/,
                use: 'null-loader'
            }
        ]
    },
    plugins: [
        new CleanWebpackPlugin([outDir], {root: distDir}),
        new DisableOutputWebpackPlugin(),
        new CopyWebpackPlugin([
                { from: `${distDir}/public`, to: `${outDir}/public` }
            ]
        ),
    ]
};
