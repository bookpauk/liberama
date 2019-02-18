const fs = require('fs-extra');
const zlib = require('zlib');
const crypto = require('crypto');
const path = require('path');
const utils = require('./utils');
const decompress = require('decompress');
const decompressGz = require('decompress-gz');
const decompressBzip2 = require('decompress-bzip2');

const FileDetector = require('./FileDetector');

class FileDecompressor {
    constructor() {
        this.detector = new FileDetector();
    }

    async decompressFile(filename, outputDir) {
        const fileType = await this.detector.detectFile(filename);

        if (!fileType || !(fileType.ext == 'zip' || fileType.ext == 'bz2' || fileType.ext == 'gz'))
            return filename;

        //дурной decompress, поэтому в 2 этапа
        //этап 1
        let files = [];
        try {
            files = await decompress(filename, outputDir);
        } catch (e) {
            //
        }

        //этап 2
        if (files.length == 0) {
            try {
                files = await decompress(filename, outputDir, {
                    inputFile: filename,
                    plugins: [
                        decompressGz(),
                        decompressBzip2({path: path.basename(filename)}),
                    ]
                });
            } catch (e) {
                //
            }
        }
        
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
        //дурной decompress
        if (result != filename)
            await fs.chmod(result, 0o664);

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
        } else {
            await utils.touchFile(outFilename);
        }

        return outFilename;
    }
}

module.exports = FileDecompressor;