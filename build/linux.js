const fs = require('fs-extra');
const path = require('path');
const util = require('util');
const stream = require('stream');
const pipeline = util.promisify(stream.pipeline);

const axios = require('axios');
const FileDecompressor = require('../server/core/FileDecompressor');

const distDir = path.resolve(__dirname, '../dist');
const publicDir = `${distDir}/tmp/public`;
const outDir = `${distDir}/linux`;

const tempDownloadDir = `${distDir}/tmp/download`;

async function main() {
    const decomp = new FileDecompressor();

    await fs.emptyDir(outDir);
    // перемещаем public на место
    if (await fs.pathExists(publicDir))
        await fs.move(publicDir, `${outDir}/public`);

    await fs.ensureDir(tempDownloadDir);

    //ipfs
    const ipfsDecompressedFilename = `${tempDownloadDir}/go-ipfs/ipfs`;
    if (!await fs.pathExists(ipfsDecompressedFilename)) {
        // Скачиваем ipfs
        const ipfsRemoteUrl = 'https://dist.ipfs.io/go-ipfs/v0.4.18/go-ipfs_v0.4.18_linux-amd64.tar.gz';

        const res = await axios.get(ipfsRemoteUrl, {responseType: 'stream'})
        await pipeline(res.data, fs.createWriteStream(`${tempDownloadDir}/ipfs.tar.gz`));
        console.log(`done downloading ${ipfsRemoteUrl}`);

        //распаковываем
        console.log(await decomp.unpackTarZZ(`${tempDownloadDir}/ipfs.tar.gz`, tempDownloadDir));
        console.log('files decompressed');
    }

    // копируем в дистрибутив
    await fs.copy(ipfsDecompressedFilename, `${outDir}/ipfs`);
    console.log(`copied ${tempDownloadDir}/go-ipfs/ipfs to ${outDir}/ipfs`);
    //для development
    const devIpfsFile = path.resolve(__dirname, '../server/ipfs');
    if (!await fs.pathExists(devIpfsFile)) {
        await fs.copy(ipfsDecompressedFilename, devIpfsFile);
    }
}

main();
