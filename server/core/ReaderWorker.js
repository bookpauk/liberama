const workerState = require('./workerState');
const fs = require('fs-extra');

class ReaderWorker {
    constructor(config) {
        this.config = Object.assign({}, config);
        this.config.tempDownloadDir = `${config.tempDir}/download`;
        fs.ensureDirSync(this.config.tempDownloadDir);
    }

    async loadBook(url, wState) {
        const loader = require('./readerLoader');
        loader(url, this.config, (state) => {
            wState.set(state)
        });
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