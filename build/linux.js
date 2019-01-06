const fs = require('fs-extra');
const path = require('path');

const download = require('download');
const decompress = require('decompress');
const decompressTargz = require('decompress-targz');

const distDir = path.resolve(__dirname, '../dist');
const publicDir = `${distDir}/tmp/public`;
const outDir = `${distDir}/linux`;

const tempDownloadDir = `${distDir}/tmp/download`;

async function main() {
    // перемещаем public на место
    await fs.emptyDir(outDir);
    await fs.move(publicDir, `${outDir}/public`);

    await fs.ensureDir(tempDownloadDir);
    // Скачиваем ipfs
    const ipfsRemoteUrl = 'https://dist.ipfs.io/go-ipfs/v0.4.18/go-ipfs_v0.4.18_linux-amd64.tar.gz';

    d = download(ipfsRemoteUrl);
    d.pipe(fs.createWriteStream(`${tempDownloadDir}/ipfs.tar.gz`));
    d.on('end', async() => {
        console.log(`done downloading ${ipfsRemoteUrl}`);

        //распаковываем
        await decompress(`${tempDownloadDir}/ipfs.tar.gz`, `${tempDownloadDir}`, {
            plugins: [
                decompressTargz()
            ]
        });

        console.log('files decompressed');
        // копируем в дистрибутив
        await fs.copy(`${tempDownloadDir}/go-ipfs/ipfs`, `${outDir}/ipfs`);
        console.log(`copied ${tempDownloadDir}/go-ipfs/ipfs to ${outDir}/ipfs`);
        //для development
        await fs.copy(`${tempDownloadDir}/go-ipfs/ipfs`, path.resolve(__dirname, '../server/ipfs'));
    });
}

main();
