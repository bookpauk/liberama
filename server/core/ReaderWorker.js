const fs = require('fs-extra');

const workerState = require('./workerState');
const FileDownloader = require('./FileDownloader');
const FileDecompressor = require('./FileDecompressor');
const BookConverter = require('./BookConverter');
const utils = require('./utils');

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
    }

    async loadBook(url, wState) {
        let errMes = '';
        let decompDir = '';
        let downloadedFilename = '';
        try {
            wState.set({state: 'download', step: 1, totalSteps: 3, url});

            const tempFilename = utils.randomHexString(30);
            const tempFilename2 = utils.randomHexString(30);
            const decompDirname = utils.randomHexString(30);

            //download
            const downdata = await this.down.load(url, (progress) => {
                wState.set({progress});
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
            wState.set({state: 'convert', step: 3, progress: 0});
            let resultFilename = `${this.config.tempPublicDir}/${tempFilename2}`;
            await this.bookConverter.convertToFb2(decompFilename, resultFilename, url, progress => {
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