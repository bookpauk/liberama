const workerState = require('./workerState');
const FileDetector = require('./FileDetector');
const FileDecompressor = require('./FileDecompressor');
//const BookParser = require('./BookParser');
const utils = require('./utils');

const fs = require('fs-extra');
const util = require('util');
const stream = require('stream');
const pipeline = util.promisify(stream.pipeline);
const download = require('download');

class ReaderWorker {
    constructor(config) {
        this.config = Object.assign({}, config);
        this.config.tempDownloadDir = `${config.tempDir}/download`;
        fs.ensureDirSync(this.config.tempDownloadDir);
        this.detector = new FileDetector();
        this.decomp = new FileDecompressor();
    }

    async loadBook(url, wState) {
        const maxDownloadSize = 10*1024*1024;
        let errMes = '';
        try {
            wState.set({state: 'download', step: 1, totalSteps: 3, url});

            const tempFilename = utils.randomHexString(30);
            const tempFilename2 = utils.randomHexString(30);
            const decompDirname = utils.randomHexString(30);

            //download
            const d = download(url);
            d.on('downloadProgress', progress => {
                wState.set({progress:  Math.round(progress.percent*100)});
                if (progress.transferred > maxDownloadSize) {
                    errMes = 'file too big';
                    d.destroy();
                }
            });
            const downloadedFilename = `${this.config.tempDownloadDir}/${tempFilename}`;
            await pipeline(d, fs.createWriteStream(downloadedFilename));

            //decompress
            wState.set({state: 'decompress', step: 2, progress: 0});
            const decompDir = `${this.config.tempDownloadDir}/${decompDirname}`;
            const decompFilename = await this.decomp.decompressFile(downloadedFilename, decompDir);
            wState.set({progress: 100});
            
            //parse book
            const fileType = await this.detector.detectFile(decompFilename);
            if (fileType.ext == 'html' || fileType.ext == 'xml') {
                //parse
            }

            //clean
            await fs.remove(decompDir);
            await fs.remove(downloadedFilename);

            wState.finish({step: 3, file: tempFilename, fileType: fileType});
        } catch (e) {
            wState.set({state: 'error', error: (errMes ? errMes : e.message)});
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