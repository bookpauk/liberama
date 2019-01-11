const workerState = require('./workerState');
const utils = require('./utils');

const fs = require('fs-extra');
const util = require('util');
const stream = require('stream');
const pipeline = util.promisify(stream.pipeline);
const download = require('download');

class ReaderWorker {
    constructor(config) {
        this.config = config;
        this.tempDownloadDir = `${config.tempDir}/download`;
        fs.ensureDirSync(this.tempDownloadDir);
    }

    async loadBook(wState, url) {
        try {
            wState.set({state: 'download', step: 1, totalSteps: 3, url});

            const tempFilename = utils.randomHexString(30);
            const d = download(url);
            d.on('downloadProgress', progress => {
                wState.set({progress:  Math.round(progress.percent*100)});
            })

            await pipeline(d, fs.createWriteStream(`${this.tempDownloadDir}/${tempFilename}`));
            
            wState.finish({step: 3, file: tempFilename});
        } catch (e) {
            wState.set({state: 'error', error: e.message});
        }
    }

    loadBookUrl(url) {
        const workerId = workerState.generateWorkerId();
        const wState = workerState.getControl(workerId);
        wState.set({state: 'start'});

        this.loadBook(wState, url);

        return workerId;
    }
}

module.exports = ReaderWorker;