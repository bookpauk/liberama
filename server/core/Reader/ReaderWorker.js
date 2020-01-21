const fs = require('fs-extra');
const path = require('path');

const WorkerState = require('../WorkerState');//singleton
const FileDownloader = require('../FileDownloader');
const FileDecompressor = require('../FileDecompressor');
const BookConverter = require('./BookConverter');
const RemoteWebDavStorage = require('../RemoteWebDavStorage');

const utils = require('../utils');
const log = new (require('../AppLogger'))().log;//singleton

const cleanDirPeriod = 60*60*1000;//1 раз в час

let instance = null;

//singleton
class ReaderWorker {
    constructor(config) {
        if (!instance) {
            this.config = Object.assign({}, config);
            
            this.config.tempDownloadDir = `${config.tempDir}/download`;
            fs.ensureDirSync(this.config.tempDownloadDir);

            this.config.tempPublicDir = `${config.publicDir}/tmp`;
            fs.ensureDirSync(this.config.tempPublicDir);

            this.workerState = new WorkerState();
            this.down = new FileDownloader();
            this.decomp = new FileDecompressor();
            this.bookConverter = new BookConverter(this.config);

            this.remoteWebDavStorage = false;
            if (config.remoteWebDavStorage) {
                this.remoteWebDavStorage = new RemoteWebDavStorage(
                    Object.assign({maxContentLength: config.maxUploadFileSize}, config.remoteWebDavStorage)
                );
            }

            this.periodicCleanDir(this.config.tempPublicDir, this.config.maxTempPublicDirSize, cleanDirPeriod);
            this.periodicCleanDir(this.config.uploadDir, this.config.maxUploadPublicDirSize, cleanDirPeriod);
            
            instance = this;
        }

        return instance;
    }

    async loadBook(opts, wState) {
        const url = opts.url;
        let decompDir = '';
        let downloadedFilename = '';
        let isUploaded = false;
        let convertFilename = '';
        try {
            wState.set({state: 'download', step: 1, totalSteps: 3, url});

            const tempFilename = utils.randomHexString(30);
            const tempFilename2 = utils.randomHexString(30);
            const decompDirname = utils.randomHexString(30);

            if (url.indexOf('file://') != 0) {//download
                const downdata = await this.down.load(url, (progress) => {
                    wState.set({progress});
                });

                downloadedFilename = `${this.config.tempDownloadDir}/${tempFilename}`;
                await fs.writeFile(downloadedFilename, downdata);
            } else {//uploaded file
                downloadedFilename = `${this.config.uploadDir}/${url.substr(7)}`;
                if (!await fs.pathExists(downloadedFilename)) 
                    throw new Error('Файл не найден на сервере (возможно был удален как устаревший). Пожалуйста, загрузите файл с диска на сервер заново.');
                await utils.touchFile(downloadedFilename);
                isUploaded = true;
            }
            wState.set({progress: 100});

            //decompress
            wState.set({state: 'decompress', step: 2, progress: 0});
            decompDir = `${this.config.tempDownloadDir}/${decompDirname}`;
            let decompFiles = {};
            try {
                decompFiles = await this.decomp.decompressNested(downloadedFilename, decompDir);
            } catch (e) {
                log(LM_ERR, e.stack);
                throw new Error('Ошибка распаковки');
            }
            wState.set({progress: 100});
            
            //конвертирование в fb2
            wState.set({state: 'convert', step: 3, progress: 0});
            convertFilename = `${this.config.tempDownloadDir}/${tempFilename2}`;
            await this.bookConverter.convertToFb2(decompFiles, convertFilename, opts, progress => {
                wState.set({progress});
            });

            //сжимаем файл в tmp, если там уже нет с тем же именем-sha256
            const compFilename = await this.decomp.gzipFileIfNotExists(convertFilename, this.config.tempPublicDir);
            const stat = await fs.stat(compFilename);

            wState.set({progress: 100});

            //finish
            const finishFilename = path.basename(compFilename);
            wState.finish({path: `/tmp/${finishFilename}`, size: stat.size});

            //лениво сохраним compFilename в удаленном хранилище
            if (this.remoteWebDavStorage) {
                (async() => {
                    await utils.sleep(20*1000);
                    try {
                        //log(`remoteWebDavStorage.putFile ${path.basename(compFilename)}`);
                        await this.remoteWebDavStorage.putFile(compFilename);
                    } catch (e) {
                        log(LM_ERR, e.stack);
                    }
                })();
            }

        } catch (e) {
            log(LM_ERR, e.stack);
            wState.set({state: 'error', error: e.message});
        } finally {
            //clean
            if (decompDir)
                await fs.remove(decompDir);
            if (downloadedFilename && !isUploaded)
                await fs.remove(downloadedFilename);
            if (convertFilename)
                await fs.remove(convertFilename);
        }
    }

    loadBookUrl(opts) {
        const workerId = this.workerState.generateWorkerId();
        const wState = this.workerState.getControl(workerId);
        wState.set({state: 'start'});

        this.loadBook(opts, wState);

        return workerId;
    }

    async saveFile(file) {
        const hash = await utils.getFileHash(file.path, 'sha256', 'hex');
        const outFilename = `${this.config.uploadDir}/${hash}`;

        if (!await fs.pathExists(outFilename)) {
            await fs.move(file.path, outFilename);
        } else {
            await utils.touchFile(outFilename);
            await fs.remove(file.path);
        }

        return `file://${hash}`;
    }

    restoreCachedFile(filename) {
        const workerId = this.workerState.generateWorkerId();
        const wState = this.workerState.getControl(workerId);
        wState.set({state: 'start'});

        (async() => {
            try {
                wState.set({state: 'download', step: 1, totalSteps: 1, path: filename, progress: 0});

                const basename = path.basename(filename);
                const targetName = `${this.config.tempPublicDir}/${basename}`;

                if (!await fs.pathExists(targetName)) {
                    let found = false;
                    if (this.remoteWebDavStorage) {
                        found = await this.remoteWebDavStorage.getFileSuccess(targetName);
                    } 

                    if (!found) {
                        throw new Error('404 Файл не найден');
                    }
                }

                const stat = await fs.stat(targetName);
                wState.finish({path: `/tmp/${basename}`, size: stat.size, progress: 100});
            } catch (e) {
                if (e.message.indexOf('404') < 0)
                    log(LM_ERR, e.stack);
                wState.set({state: 'error', error: e.message});
            }
        })();

        return workerId;
    }

    async periodicCleanDir(dir, maxSize, timeout) {
        try {
            const list = await fs.readdir(dir);

            let size = 0;
            let files = [];
            for (const name of list) {
                const stat = await fs.stat(`${dir}/${name}`);
                if (!stat.isDirectory()) {
                    size += stat.size;
                    files.push({name, stat});
                }
            }
            log(`clean dir ${dir}, maxSize=${maxSize}, found ${files.length} files`);

            files.sort((a, b) => a.stat.mtimeMs - b.stat.mtimeMs);

            let i = 0;
            while (i < files.length && size > maxSize) {
                const file = files[i];
                const oldFile = `${dir}/${file.name}`;

                //отправляем только this.config.tempPublicDir
                //TODO: убрать в будущем, т.к. уже делается ленивое сохранение compFilename в удаленном хранилище
                if (this.remoteWebDavStorage && dir === this.config.tempPublicDir) {
                    try {
                        //log(`remoteWebDavStorage.putFile ${path.basename(oldFile)}`);
                        await this.remoteWebDavStorage.putFile(oldFile);
                    } catch (e) {
                        log(LM_ERR, e.stack);
                    }
                }
                await fs.remove(oldFile);
                size -= file.stat.size;
                i++;
            }
            log(`removed ${i} files`);
        } catch(e) {
            log(LM_ERR, e.stack);
        } finally {
            setTimeout(() => {
                this.periodicCleanDir(dir, maxSize, timeout);
            }, timeout);
        }
    }
}

module.exports = ReaderWorker;