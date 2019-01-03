const path = require("path");
const webpack = require("webpack");

const merge = require("webpack-merge");
const baseWpConfig = require("./webpack.base.config");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CleanWebpackPlugin = require('clean-webpack-plugin');

module.exports = merge(baseWpConfig, {
    mode: 'production',
    module: {
        rules: [
            {
                test: /\.vue$/,
                loader: "vue-loader",
            },
            {
                test: /\.css$/,
                use: [
                  MiniCssExtractPlugin.loader,
                  'css-loader'
                ]
            }
        ]
    },
    plugins: [
        new CleanWebpackPlugin([`${baseWpConfig.output.path}/*.*`], {root: path.resolve(__dirname, '..')}),
        new MiniCssExtractPlugin({
            filename: "[name].css"
        })
    ]
});
