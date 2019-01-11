const utils = require('./utils');

const fs = require('fs-extra');
const util = require('util');
const stream = require('stream');
const pipeline = util.promisify(stream.pipeline);
const download = require('download');

async function main(url, config, setState) {
    const maxDownloadSize = 10*1024*1024;
    let errMes = '';
    try {
        setState({state: 'download', step: 1, totalSteps: 3, url});

        const tempFilename = utils.randomHexString(30);
        const d = download(url);
        d.on('downloadProgress', progress => {
            setState({progress:  Math.round(progress.percent*100)});
            if (progress.transferred > maxDownloadSize) {
                errMes = 'file too big';
                d.destroy();
            }
        });
        await pipeline(d, fs.createWriteStream(`${config.tempDownloadDir}/${tempFilename}`));
        
        setState({state: 'finish', step: 3, file: tempFilename});
    } catch (e) {
        setState({state: 'error', error: (errMes ? errMes : e.message)});
    }
}

module.exports = main;