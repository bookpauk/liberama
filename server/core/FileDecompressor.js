const fs = require('fs-extra');
const zlib = require('zlib');
const path = require('path');
const unbzip2Stream = require('unbzip2-stream');
const tar = require('tar-fs');
const iconv = require('iconv-lite');

const ZipStreamer = require('./Zip/ZipStreamer');
const appLogger = new (require('./AppLogger'))();//singleton
const FileDetector = require('./FileDetector');
const textUtils = require('./Reader/BookConverter/textUtils');
const utils = require('./utils');

class FileDecompressor {
    constructor(limitFileSize = 0) {
        this.detector = new FileDetector();
        this.limitFileSize = limitFileSize;

        this.rarPath = '/usr/bin/rar';
        this.rarExists = false;
        (async() => {
            if (await fs.pathExists(this.rarPath))
                this.rarExists = true;
        })();
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

        if (!fileType || !(
                    fileType.ext == 'zip' || fileType.ext == 'bz2' || fileType.ext == 'gz'
                    || fileType.ext == 'tar' || (this.rarExists && fileType.ext == 'rar')
                )
            ) {
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

        if (fileExt == 'rar' && this.rarExists) {
            files = await this.unRar(filename, outputDir);
            return files;
        }

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
        const zip = new ZipStreamer();
        try {
            return await zip.unpack(filename, outputDir, {
                limitFileSize: this.limitFileSize, 
                limitFileCount: 1000,
                decodeEntryNameCallback: (nameRaw) => {
                    return utils.bufferRemoveZeroes(nameRaw);
                }
            });
        } catch (e) {
            fs.emptyDir(outputDir);
            return await zip.unpack(filename, outputDir, {
                limitFileSize: this.limitFileSize, 
                limitFileCount: 1000,
                decodeEntryNameCallback: (nameRaw) => {
                    nameRaw = utils.bufferRemoveZeroes(nameRaw);
                    const enc = textUtils.getEncodingLite(nameRaw);
                    if (enc.indexOf('ISO-8859') < 0) {
                        return iconv.decode(nameRaw, enc);
                    }
                    return nameRaw;
                }
            });
        }
    }

    unBz2(filename, outputDir) {
        return this.decompressByStream(unbzip2Stream(), filename, outputDir);
    }

    unGz(filename, outputDir) {
        return this.decompressByStream(zlib.createGunzip(), filename, outputDir);
    }

    unTar(filename, outputDir) {
        return new Promise((resolve, reject) => { (async() => {
            const files = [];

            if (this.limitFileSize) {
                if ((await fs.stat(filename)).size > this.limitFileSize) {
                    reject(new Error('Файл слишком большой'));
                    return;
                }
            }

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
        })().catch(reject); });
    }

    decompressByStream(stream, filename, outputDir) {
        return new Promise((resolve, reject) => { (async() => {
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

            stream.on('error', reject);

            if (this.limitFileSize) {
                let readSize = 0;
                stream.on('data', (buffer) => {
                    readSize += buffer.length;
                    if (readSize > this.limitFileSize)
                        stream.destroy(new Error('Файл слишком большой'));
                });
            }

            inputStream.on('error', reject);
            outputStream.on('error', reject);
        
            inputStream.pipe(stream).pipe(outputStream);
        })().catch(reject); });
    }

    async unRar(filename, outputDir) {
        try {
            const args = ['x', '-p-', '-y', filename, `${outputDir}`];
            const result = await utils.spawnProcess(this.rarPath, {
                killAfter: 60,
                args
            });

            if (result.code == 0) {
                const files = [];
                await utils.findFiles(async(file) => {
                    const stat = await fs.stat(file);
                    files.push({path: path.relative(outputDir, file), size: stat.size});
                }, outputDir);

                return files;

            } else {
                const error = `${result.code}|FORLOG|, exec: ${this.rarPath}, args: ${args.join(' ')}, stdout: ${result.stdout}, stderr: ${result.stderr}`;
                throw new Error(`Архиватор Rar завершился с ошибкой: ${error}`);
            }
        } catch(e) {
            if (e.status == 'killed') {
                throw new Error('Слишком долгое ожидание архиватора Rar');
            } else if (e.status == 'error') {
                throw new Error(e.error);
            } else {
                throw new Error(e);
            }
        }
    }

    async gzipBuffer(buf) {
        return new Promise((resolve, reject) => {
            zlib.gzip(buf, {level: 1}, (err, result) => {
                if (err) reject(err);
                resolve(result);
            });
        });
    }

    async gzipFile(inputFile, outputFile, level = 1) {
        return new Promise((resolve, reject) => {
            const gzip = zlib.createGzip({level});
            const input = fs.createReadStream(inputFile);
            const output = fs.createWriteStream(outputFile);

            input.pipe(gzip).pipe(output).on('finish', (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    async gzipFileIfNotExists(filename, outDir, isMaxCompression) {
        const hash = await utils.getFileHash(filename, 'sha256', 'hex');

        const outFilename = `${outDir}/${hash}`;

        if (!await fs.pathExists(outFilename)) {
            await this.gzipFile(filename, outFilename, (isMaxCompression ? 9 : 1));

            // переупакуем через некоторое время на максималках, если упаковали плохо
            if (!isMaxCompression) {
                const filenameCopy = `${filename}.copy`;
                await fs.copy(filename, filenameCopy);

                (async() => {
                    await utils.sleep(5000);
                    const filenameGZ = `${filename}.gz`;
                    await this.gzipFile(filenameCopy, filenameGZ, 9);

                    await fs.move(filenameGZ, outFilename, {overwrite: true});

                    await fs.remove(filenameCopy);
                })().catch((e) => { if (appLogger.inited) appLogger.log(LM_ERR, `FileDecompressor.gzipFileIfNotExists: ${e.message}`) });
            }
        } else {
            await utils.touchFile(outFilename);
        }

        return outFilename;
    }
}

module.exports = FileDecompressor;