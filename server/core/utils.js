const crypto = require('crypto');

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function randomHexString(len) {
    return crypto.randomBytes(len).toString('hex')
}

module.exports = {
    sleep,
    randomHexString
};