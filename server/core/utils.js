const { spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const baseX = require('base-x');
const pidusage = require('pidusage');

const BASE36 = '0123456789abcdefghijklmnopqrstuvwxyz';
const bs36 = baseX(BASE36);

function toBase36(data) {
    return bs36.encode(Buffer.from(data));
}

function fromBase36(data) {
    return bs36.decode(data);
}

function bufferRemoveZeroes(buf) {
    const i = buf.indexOf(0);
    if (i >= 0) {
        return buf.slice(0, i);
    }
    return buf;
}

function getFileHash(filename, hashName, enc) {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash(hashName);
        const rs = fs.createReadStream(filename);
        rs.on('error', reject);
        rs.on('data', chunk => hash.update(chunk));
        rs.on('end', () => resolve(hash.digest(enc)));
    });
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function toUnixTime(time) {
    return parseInt(time/1000);
}

function randomHexString(len) {
    return crypto.randomBytes(len).toString('hex')
}

async function touchFile(filename) {
    await fs.utimes(filename, Date.now()/1000, Date.now()/1000);
}

function spawnProcess(cmd, opts) {
    let {args, killAfter, onData, onUsage, onUsageInterval, abort} = opts;
    killAfter = (killAfter ? killAfter : 120);//seconds
    onData = (onData ? onData : () => {});
    args = (args ? args : []);
    onUsageInterval = (onUsageInterval ? onUsageInterval : 30);//seconds

    return new Promise((resolve, reject) => { (async() => {
        let resolved = false;
        const proc = spawn(cmd, args, {detached: true});

        let stdout = '';
        proc.stdout.on('data', (data) => {
            stdout += data;
            onData(data);
        });

        let stderr = '';
        proc.stderr.on('data', (data) => {
            stderr += data;
            onData(data);
        });

        proc.on('close', (code) => {
            resolved = true;
            resolve({status: 'close', code, stdout, stderr});
        });

        proc.on('error', (error) => {
            reject({status: 'error', error, stdout, stderr});
        });

        //ждем процесс, контролируем его работу раз в секунду
        let onUsageCounter = onUsageInterval;
        while (!resolved) {
            await sleep(1000);

            onUsageCounter--;
            if (onUsage && onUsageCounter <= 0) {
                const stats = await pidusage(proc.pid);
                onUsage(stats);
                onUsageCounter = onUsageInterval;
            }

            killAfter--;
            if (killAfter <= 0 || (abort && abort())) {
                process.kill(proc.pid);
                if (killAfter <= 0) {
                    reject({status: 'killed', stdout, stderr});
                } else {
                    reject({status: 'abort', stdout, stderr});
                }
                break;
            }
        }
    })().catch(reject); });
}

async function findFiles(callback, dir) {
    if (!(callback && dir))
        return;
    let result = true;
    const files = await fs.readdir(dir, { withFileTypes: true });

    for (const file of files) {
        const found = path.resolve(dir, file.name);
        if (file.isDirectory())
            result = await findFiles(callback, found);
        else
            await callback(found);
    }
    return result;
}

module.exports = {
    toBase36,
    fromBase36,
    bufferRemoveZeroes,
    getFileHash,
    sleep,
    toUnixTime,
    randomHexString,
    touchFile,
    spawnProcess,
    findFiles
};