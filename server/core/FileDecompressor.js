const fs = require('fs-extra');
const zlib = require('zlib');
const crypto = require('crypto');
const decompress = require('decompress');
const FileDetector = require('./FileDetector');

class FileDecompressor {
    constructor() {
        this.detector = new FileDetector();
    }

    async decompressFile(filename, outputDir) {
        const fileType = await this.detector.detectFile(filename);

        if (!fileType || !(fileType.ext == 'zip' || fileType.ext == 'bz2'))
            return filename;

        const files = await decompress(filename, outputDir);

        let result = filename;
        let max = 0;
        if (files.length) {
            //ищем файл с максимальным размером
            for (let file of files) {
                if (file.data.length > max) {
                    result = `${outputDir}/${file.path}`;
                    max = file.data.length;
                }
            }
        }

        return result;
    }

    async gzipBuffer(buf) {
        return new Promise((resolve, reject) => {
            zlib.gzip(buf, {level: 1}, (err, result) => {
                if (err) reject(err);
                resolve(result);
            });
        });
    }

    async gzipFileIfNotExists(filename, outDir) {
        const buf = await fs.readFile(filename);

        const hash = crypto.createHash('sha256').update(buf).digest('hex');

        const outFilename = `${outDir}/${hash}`;

        if (!await fs.pathExists(outFilename)) {
            await fs.writeFile(outFilename, await this.gzipBuffer(buf))
        }

        return outFilename;
    }
}

module.exports = FileDecompressor;