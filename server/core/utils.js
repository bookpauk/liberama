const Promise = require('bluebird');
const fs = require('fs');

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function statPathSync(path) {
    try {
        return fs.statSync(path);
    } catch (ex) {}
    return false;
}

function mkDirIfNotExistsSync(path) {
    let exists = statPathSync(path);
    if (!exists) {
        fs.mkdirSync(path, {recursive: true, mode: 0o755});
    } else if (!exists.isDirectory()) {
        throw new Error(`Not a directory: ${path}`);
    }
}

module.exports = {
    sleep,
    statPathSync,
    mkDirIfNotExistsSync,
};