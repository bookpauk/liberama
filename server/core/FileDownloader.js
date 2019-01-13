const got = require('got');

class FileDownloader {
    constructor() {
    }

    async load(url, callback) {
        const maxDownloadSize = 10*1024*1024;

        let estSize = 100000;
        const request = got(url).on('downloadProgress', progress => {
            if (progress.transferred > maxDownloadSize) {
                request.cancel();
            }
            const prog = Math.round(progress.transferred/estSize*100);
            if (callback)
                callback(prog);
            if (prog > 100)
                estSize *= 1.5;
        });


        try {
            return (await request).body;
        } catch (error) {
            if (request.isCanceled) {
                throw new Error('file too big')
            }
            throw error;
        }
    }
}

module.exports = FileDownloader;