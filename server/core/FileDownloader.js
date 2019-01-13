const got = require('got');

class FileDownloader {
    constructor() {
    }

    async load(url, callback) {
        const maxDownloadSize = 10*1024*1024;
        let errMes = '';

        const response = await got(url, {method: 'HEAD'});

        let estSize = 100000;
        if (response.headers['content-length']) {
            estSize = response.headers['content-length'];
        }

        const request = got(url, {encoding: null}).on('downloadProgress', progress => {
            if (progress.transferred > maxDownloadSize) {
                errMes = 'file too big';
                request.cancel();
            }
            const prog = Math.round(progress.transferred/estSize*100);
            if (callback)
                callback((prog > 100 ? 100 : prog));
            if (prog > 100)
                estSize *= 1.5;
        });


        try {
            return (await request).body;
        } catch (error) {
            errMes = (errMes ? errMes : error.message);
            throw new Error(errMes);
        }
    }
}

module.exports = FileDownloader;