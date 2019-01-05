const sqliteRemoteUrl = 'https://mapbox-node-binary.s3.amazonaws.com/sqlite3/v4.0.4';
const sqliteFile = 'node-v64-win32-x64';

const path = require("path");
const webpack = require("webpack");

const fs = require('fs');
const download = require('download');
const decompress = require('decompress');
const decompressTargz = require('decompress-targz');

const CleanWebpackPlugin = require('clean-webpack-plugin');
const DisableOutputWebpackPlugin = require('disable-output-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const EventHooksPlugin = require('event-hooks-webpack-plugin');

const distDir = path.resolve(__dirname, '../dist');
const publicDir = `${distDir}/tmp/public`;
const outDir = `${distDir}/win`;

const sqliteFilename = `${sqliteFile}.tar.gz`;
const tempDir = `${distDir}/tmp/sqlite`;
const sqliteDecompressedFilename = `${tempDir}/${sqliteFile}/node_sqlite3.node`;
const sqliteDistFilename = `${outDir}/node_sqlite3.node`;

module.exports = {
    mode: 'production',
    entry: `${publicDir}/index.html`,
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
        new CleanWebpackPlugin([outDir, tempDir], {root: distDir}),
        new DisableOutputWebpackPlugin(),
        new CopyWebpackPlugin([
                { from: publicDir, to: `${outDir}/public` }
            ]
        ),
        new EventHooksPlugin({
            done: () => {
                // Скачиваем node_sqlite3.node для винды, т.к. pkg не включает его в сборку
                const url = `${sqliteRemoteUrl}/${sqliteFilename}`;
                fs.mkdirSync(tempDir);
                const d = download(url);
                d.pipe(fs.createWriteStream(`${tempDir}/${sqliteFilename}`));
                d.on('end', () => {
                    console.log(`downloading ${url} done`);

                    //распаковываем
                    decompress(`${tempDir}/${sqliteFilename}`, `${tempDir}`, {
                        plugins: [
                            decompressTargz()
                        ]
                    }).then(() => {
                        console.log('files decompressed');
                        // копируем в дистрибутив
                        fs.copyFileSync(sqliteDecompressedFilename, sqliteDistFilename);
                        console.log(`copied ${sqliteDecompressedFilename} to ${sqliteDistFilename}`);
                    });
                });
            }
        })
    ]
};
