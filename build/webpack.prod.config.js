const path = require("path");
const webpack = require("webpack");

const merge = require("webpack-merge");
const baseWpConfig = require("./webpack.base.config");
const TerserPlugin = require('terser-webpack-plugin');
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
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
    optimization: {
        minimizer: [
            new TerserPlugin(),
            new OptimizeCSSAssetsPlugin()
        ]
    },
    plugins: [
        new CleanWebpackPlugin([`${baseWpConfig.output.path}/*.*`], {root: path.resolve(__dirname, '..')}),
        new MiniCssExtractPlugin({
            filename: "[name].css"
        })
    ]
});
