const fs = require('fs-extra');
const crypto = require('crypto');

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function randomHexString(len) {
    return crypto.randomBytes(len).toString('hex')
}

async function touchFile(filename) {
    await fs.utimes(filename, Date.now()/1000, Date.now()/1000);
}

module.exports = {
    sleep,
    randomHexString,
    touchFile
};