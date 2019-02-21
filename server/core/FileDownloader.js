const got = require('got');

const maxDownloadSize = 50*1024*1024;

class FileDownloader {
    constructor() {
    }

    async load(url, callback) {
        let errMes = '';
        const options = {
            encoding: null,
            headers: {
                'user-agent': 'Mozilla/5.0 (X11; HasCodingOs 1.0; Linux x64) AppleWebKit/637.36 (KHTML, like Gecko) Chrome/70.0.3112.101 Safari/637.36 HasBrowser/5.0'
            }
        };

        const response = await got(url, Object.assign({}, options, {method: 'HEAD'}));

        let estSize = 0;
        if (response.headers['content-length']) {
            estSize = response.headers['content-length'];
        }

        let prevProg = 0;
        const request = got(url, options).on('downloadProgress', progress => {
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