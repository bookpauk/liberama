const fs = require('fs-extra');
const path = require('path');
const util = require('util');
const stream = require('stream');
const pipeline = util.promisify(stream.pipeline);

const axios = require('axios');
const FileDecompressor = require('../server/core/FileDecompressor');

const distDir = path.resolve(__dirname, '../dist');
const publicDir = `${distDir}/tmp/public`;
const outDir = `${distDir}/win`;

const tempDownloadDir = `${distDir}/tmp/download`;

async function main() {
    const decomp = new FileDecompressor();

    await fs.emptyDir(outDir);
    // перемещаем public на место
    if (await fs.pathExists(publicDir))
        await fs.move(publicDir, `${outDir}/public`);

    await fs.ensureDir(tempDownloadDir);

    //sqlite3
    const sqliteRemoteUrl = 'https://mapbox-node-binary.s3.amazonaws.com/sqlite3/v5.0.2/napi-v3-win32-x64.tar.gz';
    const sqliteDecompressedFilename = `${tempDownloadDir}/napi-v3-win32-x64/node_sqlite3.node`;

    if (!await fs.pathExists(sqliteDecompressedFilename)) {
        // Скачиваем node_sqlite3.node для винды, т.к. pkg не включает его в сборку
        const res = await axios.get(sqliteRemoteUrl, {responseType: 'stream'})
        await pipeline(res.data, fs.createWriteStream(`${tempDownloadDir}/sqlite.tar.gz`));
        console.log(`done downloading ${sqliteRemoteUrl}`);

        //распаковываем
        console.log(await decomp.unpackTarZZ(`${tempDownloadDir}/sqlite.tar.gz`, tempDownloadDir));
        console.log('files decompressed');
    }
    // копируем в дистрибутив
    await fs.copy(sqliteDecompressedFilename, `${outDir}/node_sqlite3.node`);
    console.log(`copied ${sqliteDecompressedFilename} to ${outDir}/node_sqlite3.node`);

    //ipfs
    const ipfsDecompressedFilename = `${tempDownloadDir}/go-ipfs/ipfs.exe`;
    if (!await fs.pathExists(ipfsDecompressedFilename)) {
        // Скачиваем ipfs
        const ipfsRemoteUrl = 'https://dist.ipfs.io/go-ipfs/v0.4.18/go-ipfs_v0.4.18_windows-amd64.zip';

        const res = await axios.get(ipfsRemoteUrl, {responseType: 'stream'})
        await pipeline(res.data, fs.createWriteStream(`${tempDownloadDir}/ipfs.zip`));
        console.log(`done downloading ${ipfsRemoteUrl}`);

        //распаковываем
        console.log(await decomp.unpack(`${tempDownloadDir}/ipfs.zip`, tempDownloadDir));
        console.log('files decompressed');
    }
    // копируем в дистрибутив
    await fs.copy(ipfsDecompressedFilename, `${outDir}/ipfs.exe`);
    console.log(`copied ${ipfsDecompressedFilename} to ${outDir}/ipfs.exe`);
}

main();