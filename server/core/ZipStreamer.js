const fs = require('fs-extra');
const path = require('path');

const zipStream = require('zip-stream');
const unzipStream = require('node-stream-zip');

class ZipStreamer {
    constructor() {
    }

    //TODO: сделать рекурсивный обход директорий, пока только файлы
    //files = ['filename', 'dirname/']
    pack(zipFile, files, options, entryCallback) {
        return new Promise((resolve, reject) => { (async() => {
            entryCallback = (entryCallback ? entryCallback : () => {});
            const zip = new zipStream(options);

            const outputStream = fs.createWriteStream(zipFile);

            outputStream.on('error', reject);
            outputStream.on('finish', async() => {
                let file = {path: zipFile};
                try {
                    file.size = (await fs.stat(zipFile)).size;
                } catch (e) {
                    reject(e);
                }
                resolve(file);
            });            

            zip.on('error', reject);
            zip.pipe(outputStream);

            const zipAddEntry = (filename) => {
                return new Promise((resolve, reject) => {
                    const basename = path.basename(filename);
                    const source = fs.createReadStream(filename);

                    zip.entry(source, {name: basename}, (err, entry) => {
                        if (err) reject(err);
                        resolve(entry);
                    });
                });
            };

            for (const filename of files) {
                const entry = await zipAddEntry(filename);
                entryCallback({path: entry.name, size: entry.size, compressedSize: entry.csize});
            }

            zip.finish();
        })().catch(reject); });
    }

    unpack(zipFile, outputDir, entryCallback) {
        return new Promise((resolve, reject) => {
            entryCallback = (entryCallback ? entryCallback : () => {});
            const unzip = new unzipStream({file: zipFile});

            unzip.on('error', reject);

            let files = [];
            unzip.on('extract', (en) => {
                const entry = {path: en.name, size: en.size, compressedSize: en.compressedSize};
                entryCallback(entry);
                files.push(entry);
            });

            unzip.on('ready', () => {
                unzip.extract(null, outputDir, (err) => {
                    if (err) reject(err);
                    unzip.close();
                    resolve(files);
                });
            });            
        });
    }
}

module.exports = ZipStreamer;