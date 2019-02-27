const { spawn } = require('child_process');
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

function spawnProcess(cmd, opts) {
    let {args, killAfter, onData} = opts;
    killAfter = (killAfter ? killAfter : 30*1000);
    onData = (onData ? onData : () => {});
    args = (args ? args : []);

    return new Promise(async(resolve, reject) => {
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

        await sleep(killAfter);
        if (!resolved) {
            process.kill(proc.pid);
            reject({status: 'killed', stdout, stderr});
        }
    });
}

module.exports = {
    sleep,
    randomHexString,
    touchFile,
    spawnProcess
};