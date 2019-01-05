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

const tempDownloadDir = `${distDir}/tmp/download`;

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
        new CleanWebpackPlugin([outDir, tempDownloadDir], {root: distDir}),
        new DisableOutputWebpackPlugin(),
        new CopyWebpackPlugin([
                { from: publicDir, to: `${outDir}/public` }
            ]
        ),
        new EventHooksPlugin({
            done: () => {
                fs.mkdirSync(tempDownloadDir);

                const sqliteRemoteUrl = 'https://mapbox-node-binary.s3.amazonaws.com/sqlite3/v4.0.4';
                const sqliteFile = 'node-v64-win32-x64';

                const sqliteFilename = `${sqliteFile}.tar.gz`;
                const sqliteDecompressedFilename = `${tempDownloadDir}/${sqliteFile}/node_sqlite3.node`;
                const sqliteDistFilename = `${outDir}/node_sqlite3.node`;

                // Скачиваем node_sqlite3.node для винды, т.к. pkg не включает его в сборку
                const url = `${sqliteRemoteUrl}/${sqliteFilename}`;
                let d = download(url);
                d.pipe(fs.createWriteStream(`${tempDownloadDir}/${sqliteFilename}`));
                d.on('end', () => {
                    console.log(`done downloading ${url}`);

                    //распаковываем
                    decompress(`${tempDownloadDir}/${sqliteFilename}`, `${tempDownloadDir}`, {
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

                // Скачиваем ipfs
                const ipfsRemoteUrl = 'https://dist.ipfs.io/go-ipfs/v0.4.18/go-ipfs_v0.4.18_windows-amd64.zip';

                d = download(ipfsRemoteUrl);
                d.pipe(fs.createWriteStream(`${tempDownloadDir}/ipfs.zip`));
                d.on('end', () => {
                    console.log(`done downloading ${ipfsRemoteUrl}`);

                    //распаковываем
                    decompress(`${tempDownloadDir}/ipfs.zip`, `${tempDownloadDir}`).then(() => {
                        console.log('files decompressed');
                        // копируем в дистрибутив
                        fs.copyFileSync(`${tempDownloadDir}/go-ipfs/ipfs.exe`, `${outDir}/ipfs.exe`);
                        console.log(`copied ${tempDownloadDir}/go-ipfs/ipfs.exe to ${outDir}/ipfs.exe`);
                    });
                });
            }
        })
    ]
};
