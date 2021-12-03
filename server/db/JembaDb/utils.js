const fsCB = require('fs');
const fs = fsCB.promises;
const zlib = require('zlib');

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function sleepWithStop(ms, cb = () => {}) {
    return new Promise(resolve => {
        const timer = setTimeout(resolve, ms);
        cb(() => { clearTimeout(timer); resolve(); });
    });
}

function unionSet(arrSet) {
    if (!arrSet.length)
        return new Set();

    let max = 0;
    let size = arrSet[0].size;
    for (let i = 1; i < arrSet.length; i++) {
        if (arrSet[i].size > size) {
            max = i;
            size = arrSet[i].size;
        }
    }

    const result = new Set(arrSet[max]);
    for (let i = 0; i < arrSet.length; i++) {
        if (i === max)
            continue;

        for (const elem of arrSet[i]) {
            result.add(elem);
        }
    }

    return result;
}

function intersectSet(arrSet) {
    if (!arrSet.length)
        return new Set();

    let min = 0;
    let size = arrSet[0].size;
    for (let i = 1; i < arrSet.length; i++) {
        if (arrSet[i].size < size) {
            min = i;
            size = arrSet[i].size;
        }
    }

    const result = new Set();
    for (const elem of arrSet[min]) {
        let inAll = true;
        for (let i = 0; i < arrSet.length; i++) {
            if (i === min)
                continue;
            if (!arrSet[i].has(elem)) {
                inAll = false;
                break;
            }
        }

        if (inAll)
            result.add(elem);
    }


    return result;
}

async function pathExists(path) {
    try {
        await fs.access(path);
        return true;
    } catch(e) {
        return false;
    }
}

async function appendFileToFile(nameFrom, nameTo) {
    return new Promise((resolve, reject) => {
        const readStream = fsCB.createReadStream(nameFrom);
        readStream.on('error', (err) => {
            reject(err);
        });

        const writeStream = fsCB.createWriteStream(nameTo, {flags: 'a'});

        writeStream.on('error', (err) => {
            reject(err);
        });

        writeStream.on('close', () => {
            resolve();
        });

        readStream.pipe(writeStream);
    });
}

function esc(obj) {
    return JSON.stringify(obj).replace(/@/g, '\\x40');
}

function paramToArray(param) {
    return (Array.isArray(param) ? param : [param]);
}

function cloneDeep(obj) {
    return JSON.parse(JSON.stringify(obj));
}

//async
function deflate(buf, compressionLevel) {
    return new Promise((resolve, reject) => {
        zlib.deflateRaw(buf, {level: compressionLevel}, (err, b) => {
            if (err)
                reject(err);
            resolve(b);
        });
    });
}

//async
function inflate(buf) {
    return new Promise((resolve, reject) => {
        zlib.inflateRaw(buf, (err, b) => {
            if (err)
                reject(err);
            resolve(b);
        });
    });
}


module.exports = {
    sleep,
    sleepWithStop,
    unionSet,
    intersectSet,
    pathExists,
    appendFileToFile,
    esc,
    paramToArray,
    cloneDeep,
    deflate,
    inflate,
};