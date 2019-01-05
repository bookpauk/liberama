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
const outDir = `${distDir}/linux`;

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
                // Скачиваем ipfs
                const ipfsRemoteUrl = 'https://dist.ipfs.io/go-ipfs/v0.4.18/go-ipfs_v0.4.18_linux-amd64.tar.gz';

                d = download(ipfsRemoteUrl);
                d.pipe(fs.createWriteStream(`${tempDownloadDir}/ipfs.tar.gz`));
                d.on('end', () => {
                    console.log(`done downloading ${ipfsRemoteUrl}`);

                    //распаковываем
                    decompress(`${tempDownloadDir}/ipfs.tar.gz`, `${tempDownloadDir}`, {
                        plugins: [
                            decompressTargz()
                        ]
                    }).then(() => {
                        console.log('files decompressed');
                        // копируем в дистрибутив
                        fs.copyFileSync(`${tempDownloadDir}/go-ipfs/ipfs`, `${outDir}/ipfs`);
                        console.log(`copied ${tempDownloadDir}/go-ipfs/ipfs to ${outDir}/ipfs`);
                        //для development
                        fs.copyFileSync(`${tempDownloadDir}/go-ipfs/ipfs`, path.resolve(__dirname, '../server/ipfs'));
                    });
                });
            }
        })
    ]
};
