const fs = require('fs-extra');
const zlib = require('zlib');
const crypto = require('crypto');
const path = require('path');
const utils = require('./utils');
const extractZip = require('extract-zip');
const unbzip2Stream = require('unbzip2-stream');

const FileDetector = require('./FileDetector');

class FileDecompressor {
    constructor() {
        this.detector = new FileDetector();
    }

    async decompressNested(filename, outputDir) {
        await fs.ensureDir(outputDir);
        
        const fileType = await this.detector.detectFile(filename);

        let result = {
            sourceFile: filename,
            sourceFileType: fileType,
            selectedFile: filename,
            filesDir: outputDir,
            files: []
        };

        if (!fileType || !(fileType.ext == 'zip' || fileType.ext == 'bz2' || fileType.ext == 'gz')) {
            return result;
        }

        result.files = await this.decompressTar(fileType.ext, filename, outputDir);

        let sel = filename;
        let max = 0;
        if (result.files.length) {
            //ищем файл с максимальным размером
            for (let file of result.files) {
                if (file.size > max) {
                    sel = `${outputDir}/${file.path}`;
                    max = file.size;
                }
            }
        }
        result.selectedFile = sel;

        if (sel != filename) {
            result.nesting = await this.decompressNested(sel, `${outputDir}/${utils.randomHexString(10)}`);
        }

        return result;
    }

    async decompressTar(fileExt, filename, outputDir) {
        return await this.decompress(fileExt, filename, outputDir);
    }

    async decompress(fileExt, filename, outputDir) {
        let files = [];

        switch (fileExt) {
            case 'zip':
                files = await this.unZip(filename, outputDir);
                break;
            case 'bz2':
                files = await this.unBz2(filename, outputDir);
                break;
            case 'gz':
                files = await this.unGz(filename, outputDir);
                break;
            case 'tar':
                files = await this.unTar(filename, outputDir);
                break;
            default:
                throw new Error(`FileDecompressor: неизвестный формат файла '${fileExt}'`);
        }

        return files;
    }

    async unZip(filename, outputDir) {
        return new Promise((resolve, reject) => {
            const files = [];
            extractZip(filename, {
                dir: outputDir,
                onEntry: (entry) => {
                    files.push({path: entry.fileName, size: entry.uncompressedSize});
                }
            }, (err) => {
                if (err)
                    reject(err);
                resolve(files);
            });
        });
    }

    async unBz2(filename, outputDir) {
        return new Promise((resolve, reject) => {
            const file = {path: path.basename(filename)};
            const outFilename = `${outputDir}/${file.path}`;
        
            const inputStream = fs.createReadStream(filename);
            const outputStream = fs.createWriteStream(outFilename);

            outputStream.on('close', async() => {
                try {
                    file.size = (await fs.stat(outFilename)).size;
                } catch (e) {
                    reject(e);
                }
                resolve([file]);
            });

            inputStream.on('error', (err) => {
                reject(err);
            });

            outputStream.on('error', (err) => {
                reject(err);
            });
        
            inputStream.pipe(unbzip2Stream()).pipe(outputStream);
        });
    }

    async unGz(filename, outputDir) {
    }

    async unTar(filename, outputDir) {
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