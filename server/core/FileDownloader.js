const got = require('got');

const maxDownloadSize = 50*1024*1024;

class FileDownloader {
    constructor() {
    }

    async load(url, callback) {
        let errMes = '';

        const response = await got(url, {method: 'HEAD'});

        let estSize = 0;
        if (response.headers['content-length']) {
            estSize = response.headers['content-length'];
        }

        let prevProg = 0;
        const request = got(url, {encoding: null}).on('downloadProgress', progress => {
            if (progress.transferred > maxDownloadSize) {
                errMes = 'file too big';
                request.cancel();
            }

            let prog = 0;
            if (estSize)
                prog = Math.round(progress.transferred/estSize*100);
            else if (progress.transferred)
                prog = Math.round(progress.transferred/(progress.transferred + 200000)*100);

            if (prog != prevProg && callback)
                callback(prog);
            prevProg = prog;
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