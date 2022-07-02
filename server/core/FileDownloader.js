const axios = require('axios');

class FileDownloader {
    constructor(limitDownloadSize = 0) {
        this.limitDownloadSize = limitDownloadSize;
    }

    async load(url, callback, abort) {
        let errMes = '';

        const options = {
            headers: {
                'user-agent': 'Mozilla/5.0 (X11; HasCodingOs 1.0; Linux x64) AppleWebKit/637.36 (KHTML, like Gecko) Chrome/70.0.3112.101 Safari/637.36 HasBrowser/5.0'
            },
            responseType: 'stream',
        };

        try {
            const res = await axios.get(url, options);

            let estSize = 0;
            if (res.headers['content-length']) {
                estSize = res.headers['content-length'];
            }

            if (estSize > this.limitDownloadSize) {
                throw new Error('Файл слишком большой');
            }

            let prevProg = 0;
            let transferred = 0;

            const download = this.streamToBuffer(res.data, (chunk) => {
                transferred += chunk.length;
                if (this.limitDownloadSize) {
                    if (transferred > this.limitDownloadSize) {
                        errMes = 'Файл слишком большой';
                        res.request.abort();
                    }
                }

                let prog = 0;
                if (estSize)
                    prog = Math.round(transferred/estSize*100);
                else
                    prog = Math.round(transferred/(transferred + 200000)*100);

                if (prog != prevProg && callback)
                    callback(prog);
                prevProg = prog;

                if (abort && abort()) {
                    errMes = 'abort';
                    res.request.abort();
                }
            });

            return await download;
        } catch (error) {
            errMes = (errMes ? errMes : error.message);
            throw new Error(errMes);
        }
    }

    streamToBuffer(stream, progress) {
        return new Promise((resolve, reject) => {
            
            if (!progress)
                progress = () => {};

            const _buf = [];

            stream.on('data', (chunk) => {
                _buf.push(chunk);
                progress(chunk);
            });
            stream.on('end', () => resolve(Buffer.concat(_buf)));
            stream.on('error', (err) => {
                reject(err);
            });
            stream.on('aborted', () => {
                reject(new Error('aborted'));
            });
        });
    }
}

module.exports = FileDownloader;
