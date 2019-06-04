const fs = require('fs-extra');
const zlib = require('zlib');
const crypto = require('crypto');
const path = require('path');
const unbzip2Stream = require('unbzip2-stream');
const tar = require('tar-fs');
const DecompressZip = require('decompress-zip');

const utils = require('./utils');
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

        if (!fileType || !(fileType.ext == 'zip' || fileType.ext == 'bz2' || fileType.ext == 'gz' || fileType.ext == 'tar')) {
            return result;
        }

        result.files = await this.decompressTarZZ(fileType.ext, filename, outputDir);

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

    async unpack(filename, outputDir) {
        const fileType = await this.detector.detectFile(filename);
        if (!fileType)
            throw new Error('Не удалось определить формат файла');

        return await this.decompress(fileType.ext, filename, outputDir);
    }

    async unpackTarZZ(filename, outputDir) {
        const fileType = await this.detector.detectFile(filename);
        if (!fileType)
            throw new Error('Не удалось определить формат файла');

        return await this.decompressTarZZ(fileType.ext, filename, outputDir);
    }

    async decompressTarZZ(fileExt, filename, outputDir) {
        const files = await this.decompress(fileExt, filename, outputDir);
        if (fileExt == 'tar' || files.length != 1)
            return files;

        const tarFilename = `${outputDir}/${files[0].path}`;
        const fileType = await this.detector.detectFile(tarFilename);
        if (!fileType || fileType.ext != 'tar')
            return files;

        const newTarFilename = `${outputDir}/${utils.randomHexString(30)}`;
        await fs.rename(tarFilename, newTarFilename);
        
        const tarFiles = await this.decompress('tar', newTarFilename, outputDir);
        await fs.remove(newTarFilename);

        return tarFiles;
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
            const unzipper = new DecompressZip(filename);

            unzipper.on('error', function(err) {
                reject(err);
            });

            unzipper.on('extract', function() {
                resolve(files);
            });

            unzipper.extract({
                path: outputDir,
                filter: function(file) {
                    if (file.type == 'File')
                        files.push({path: file.path, size: file.uncompressedSize});
                    return true;
                }
            });
        });
    }

    unBz2(filename, outputDir) {
        return this.decompressByStream(unbzip2Stream(), filename, outputDir);
    }

    unGz(filename, outputDir) {
        return this.decompressByStream(zlib.createGunzip(), filename, outputDir);
    }

    unTar(filename, outputDir) {
        return new Promise((resolve, reject) => {
            const files = [];

            const tarExtract = tar.extract(outputDir, {
                map: (header) => {
                    files.push({path: header.name, size: header.size});
                    return header;
                }
            });

            tarExtract.on('finish', () => {
                resolve(files);
            });

            tarExtract.on('error', (err) => {
                reject(err);
            });

            const inputStream = fs.createReadStream(filename);
            inputStream.on('error', (err) => {
                reject(err);
            });

            inputStream.pipe(tarExtract);
        });
    }

    decompressByStream(stream, filename, outputDir) {
        return new Promise(async(resolve, reject) => {
            const file = {path: path.parse(filename).name};
            let outFilename = `${outputDir}/${file.path}`;
            if (await fs.pathExists(outFilename)) {
                file.path = `${utils.randomHexString(10)}-${file.path}`;
                outFilename = `${outputDir}/${file.path}`;
            }
        
            const inputStream = fs.createReadStream(filename);
            const outputStream = fs.createWriteStream(outFilename);

            outputStream.on('finish', async() => {
                try {
                    file.size = (await fs.stat(outFilename)).size;
                } catch (e) {
                    reject(e);
                }
                resolve([file]);
            });

            stream.on('error', (err) => {
                reject(err);
            });

            inputStream.on('error', (err) => {
                reject(err);
            });

            outputStream.on('error', (err) => {
                reject(err);
            });
        
            inputStream.pipe(stream).pipe(outputStream);
        });
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