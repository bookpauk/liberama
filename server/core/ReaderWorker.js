const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');

const workerState = require('./workerState');
const FileDownloader = require('./FileDownloader');
const FileDecompressor = require('./FileDecompressor');
const BookConverter = require('./BookConverter');
const utils = require('./utils');

let singleCleanExecute = false;

class ReaderWorker {
    constructor(config) {
        this.config = Object.assign({}, config);
        
        this.config.tempDownloadDir = `${config.tempDir}/download`;
        fs.ensureDirSync(this.config.tempDownloadDir);

        this.config.tempPublicDir = `${config.publicDir}/tmp`;
        fs.ensureDirSync(this.config.tempPublicDir);

        this.down = new FileDownloader();
        this.decomp = new FileDecompressor();
        this.bookConverter = new BookConverter();

        if (!singleCleanExecute) {
            this.periodicCleanDir(this.config.tempPublicDir, this.config.maxTempPublicDirSize, 60*60*1000);//1 раз в час
            this.periodicCleanDir(this.config.uploadDir, this.config.maxUploadPublicDirSize, 60*60*1000);//1 раз в час
            singleCleanExecute = true;
        }
    }

    async loadBook(url, wState) {
        let errMes = '';
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
            const decompFilename = await this.decomp.decompressFile(downloadedFilename, decompDir);
            wState.set({progress: 100});
            
            //parse book
            wState.set({state: 'convert', step: 3, progress: 0});
            convertFilename = `${this.config.tempDownloadDir}/${tempFilename2}`;
            await this.bookConverter.convertToFb2(decompFilename, convertFilename, url, progress => {
                wState.set({progress});
            });

            //compress file to tmp dir, if not exists with the same hashname
            const compFilename = await this.decomp.gzipFileIfNotExists(convertFilename, `${this.config.tempPublicDir}`);

            wState.set({progress: 100});

            //finish
            const finishFilename = path.basename(compFilename);
            wState.finish({path: `/tmp/${finishFilename}`});

        } catch (e) {
            wState.set({state: 'error', error: (errMes ? errMes : e.message)});

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

    loadBookUrl(url) {
        const workerId = workerState.generateWorkerId();
        const wState = workerState.getControl(workerId);
        wState.set({state: 'start'});

        this.loadBook(url, wState);

        return workerId;
    }

    async saveFile(file) {
        const buf = await fs.readFile(file.path);

        const hash = crypto.createHash('sha256').update(buf).digest('hex');

        const outFilename = `${this.config.uploadDir}/${hash}`;

        if (!await fs.pathExists(outFilename)) {
            await fs.move(file.path, outFilename);
        } else {
            await utils.touchFile(outFilename);
            await fs.remove(file.path);
        }

        return `file://${hash}`;
    }

    async periodicCleanDir(dir, maxSize, timeout) {        
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

        files.sort((a, b) => a.stat.mtimeMs - b.stat.mtimeMs);

        let i = 0;
        while (i < files.length && size > maxSize) {
            const file = files[i];
            await fs.remove(`${dir}/${file.name}`);
            size -= file.stat.size;
            i++;
        }

        setTimeout(() => {
            this.periodicCleanDir(dir, maxSize, timeout);
        }, timeout);
    }
}

module.exports = ReaderWorker;