const path = require('path');
const fs = require('fs-extra');

const download = require('download');
const decompress = require('decompress');
const decompressTargz = require('decompress-targz');

const distDir = path.resolve(__dirname, '../dist');
const publicDir = `${distDir}/tmp/public`;
const outDir = `${distDir}/win`;

const tempDownloadDir = `${distDir}/tmp/download`;

async function main() {
    await fs.emptyDir(outDir);
    // перемещаем public на место
    if (await fs.pathExists(publicDir))
        await fs.move(publicDir, `${outDir}/public`);

    await fs.ensureDir(tempDownloadDir);
    const sqliteRemoteUrl = 'https://mapbox-node-binary.s3.amazonaws.com/sqlite3/v4.0.4/node-v64-win32-x64.tar.gz';
    const sqliteDecompressedFilename = `${tempDownloadDir}/node-v64-win32-x64/node_sqlite3.node`;

    // Скачиваем node_sqlite3.node для винды, т.к. pkg не включает его в сборку
    let d = download(sqliteRemoteUrl);
    d.pipe(fs.createWriteStream(`${tempDownloadDir}/sqlite.tar.gz`));
    d.on('end', async() => {
        console.log(`done downloading ${sqliteRemoteUrl}`);

        //распаковываем
        await decompress(`${tempDownloadDir}/sqlite.tar.gz`, `${tempDownloadDir}`, {
            plugins: [
                decompressTargz()
            ]
        });
        console.log('files decompressed');
        // копируем в дистрибутив
        await fs.copy(sqliteDecompressedFilename, `${outDir}/node_sqlite3.node`);
        console.log(`copied ${sqliteDecompressedFilename} to ${outDir}/node_sqlite3.node`);
    });

    // Скачиваем ipfs
    const ipfsRemoteUrl = 'https://dist.ipfs.io/go-ipfs/v0.4.18/go-ipfs_v0.4.18_windows-amd64.zip';

    d = download(ipfsRemoteUrl);
    d.pipe(fs.createWriteStream(`${tempDownloadDir}/ipfs.zip`));
    d.on('end', async() => {
        console.log(`done downloading ${ipfsRemoteUrl}`);

        //распаковываем
        await decompress(`${tempDownloadDir}/ipfs.zip`, `${tempDownloadDir}`);
        console.log('files decompressed');
        // копируем в дистрибутив
        await fs.copy(`${tempDownloadDir}/go-ipfs/ipfs.exe`, `${outDir}/ipfs.exe`);
        console.log(`copied ${tempDownloadDir}/go-ipfs/ipfs.exe to ${outDir}/ipfs.exe`);
    });
}

main();