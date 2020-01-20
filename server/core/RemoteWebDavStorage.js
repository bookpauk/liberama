const fs = require('fs-extra');
const path = require('path');

const WebDavFS = require('webdav-fs');

class RemoteWebDavStorage {
    constructor(config) {
        const opts = Object.assign({}, config);
        this.wfs = WebDavFS(config.url, opts);
    }

    stat(filename) {
        return new Promise((resolve, reject) => {
            this.wfs.stat(filename, function(err, fileStat) {
                if (err)
                    reject(err);
                resolve(fileStat);
            });
        });
    }

    writeFile(filename, data) {
        return new Promise((resolve, reject) => {
            this.wfs.writeFile(filename, data, 'binary', function(err) {
                if (err)
                    reject(err);
                resolve();
            });
        });
    }

    unlink(filename) {
        return new Promise((resolve, reject) => {
            this.wfs.unlink(filename, function(err) {
                if (err)
                    reject(err);
                resolve();
            });        
        });
    }

    readFile(filename) {
        return new Promise((resolve, reject) => {
            this.wfs.readFile(filename, 'binary', function(err, data) {
                if (err)
                    reject(err);
                resolve(data);
            });        
        });
    }

    mkdir(dirname) {
        return new Promise((resolve, reject) => {
            this.wfs.mkdir(dirname, function(err) {
                if (err)
                    reject(err);
                resolve();
            });
        });
    }

    async putFile(filename) {
        if (!await fs.pathExists(filename)) {
            throw new Error(`File not found: ${filename}`);
        }

        const base = path.basename(filename);
        let remoteFilename = `/${base}`;
        
        if (base.length > 3) {
            const remoteDir = `/${base.substr(0, 3)}`;
            try {
                await this.mkdir(remoteDir);
            } catch (e) {
                //
            }
            remoteFilename = `${remoteDir}/${base}`;
        }

        try {
            const localStat = await fs.stat(filename);
            const remoteStat = await this.stat(remoteFilename);
            if (remoteStat.isFile && localStat.size == remoteStat.size) {
                return;
            }
            await this.unlink(remoteFilename);
        } catch (e) {
            //
        }

        const data = await fs.readFile(filename);
        await this.writeFile(remoteFilename, data);
    }

    async getFile(filename) {
        if (await fs.pathExists(filename)) {
            return;
        }

        const base = path.basename(filename);
        let remoteFilename = `/${base}`;        
        if (base.length > 3) {
            remoteFilename = `/${base.substr(0, 3)}/${base}`;
        }

        const data = await this.readFile(remoteFilename);
        await fs.writeFile(filename, data);
    }

    async getFileSuccess(filename) {
        try {
            await this.getFile(filename);
            return true;
        } catch (e) {
            //
        }
        return false;
    }
}

module.exports = RemoteWebDavStorage;