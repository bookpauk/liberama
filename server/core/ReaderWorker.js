const workerState = require('./workerState');
const FileDetector = require('./FileDetector');
const FileDecompressor = require('./FileDecompressor');
const BookConverter = require('./BookConverter');
const utils = require('./utils');

const fs = require('fs-extra');
const download = require('download');

class ReaderWorker {
    constructor(config) {
        this.config = Object.assign({}, config);
        
        this.config.tempDownloadDir = `${config.tempDir}/download`;
        fs.ensureDirSync(this.config.tempDownloadDir);

        this.config.tempPublicDir = `${config.publicDir}/tmp`;
        fs.ensureDirSync(this.config.tempPublicDir);

        this.detector = new FileDetector();
        this.decomp = new FileDecompressor();
        this.bookConverter = new BookConverter();
    }

    async loadBook(url, wState) {
        const maxDownloadSize = 10*1024*1024;
        let errMes = '';
        let decompDir = '';
        let downloadedFilename = '';
        try {
            wState.set({state: 'download', step: 1, totalSteps: 3, url});

            const tempFilename = utils.randomHexString(30);
            const tempFilename2 = utils.randomHexString(30);
            const decompDirname = utils.randomHexString(30);

            //download
            const d = download(url);
            const downdata = await d.on('downloadProgress', progress => {
                if (progress.transferred > maxDownloadSize) {
                    errMes = 'file too big';
                    d.destroy();
                }
                const prog = Math.round(progress.transferred/10000);
                wState.set({progress: (prog > 100 ? 100 : prog) });
            });
            downloadedFilename = `${this.config.tempDownloadDir}/${tempFilename}`;
            await fs.writeFile(downloadedFilename, downdata);
            wState.set({progress: 100});

            //decompress
            wState.set({state: 'decompress', step: 2, progress: 0});
            decompDir = `${this.config.tempDownloadDir}/${decompDirname}`;
            const decompFilename = await this.decomp.decompressFile(downloadedFilename, decompDir);
            wState.set({progress: 100});
            
            //parse book
            wState.set({state: 'parse', step: 3, progress: 0});
            const fileType = await this.detector.detectFile(decompFilename);
            fileType.url = url;
            let resultFilename = `${this.config.tempPublicDir}/${tempFilename2}`;
            await this.bookConverter.convertToFb2(decompFilename, resultFilename, fileType, progress => {
                wState.set({progress});
            });
            wState.set({progress: 100});

            //finish
            wState.finish({path: `/tmp/${tempFilename2}`});

        } catch (e) {
            wState.set({state: 'error', error: (errMes ? errMes : e.message)});

        } finally {
            //clean
            if (decompDir)
                await fs.remove(decompDir);
            if (downloadedFilename)
                await fs.remove(downloadedFilename);
        }
    }

    loadBookUrl(url) {
        const workerId = workerState.generateWorkerId();
        const wState = workerState.getControl(workerId);
        wState.set({state: 'start'});

        this.loadBook(url, wState);

        return workerId;
    }
}

module.exports = ReaderWorker;