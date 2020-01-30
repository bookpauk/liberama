const fs = require('fs-extra');
const path = require('path');

const { createClient } = require('webdav');

class RemoteWebDavStorage {
    constructor(config) {
        this.config = Object.assign({}, config);
        this.config.maxContentLength = this.config.maxContentLength || 10*1024*1024;
        this.wdc = createClient(config.url, this.config);
    }

    _convertStat(data) {
        return {
            isDirectory: function() {
                return data.type === "directory";
            },
            isFile: function() {
                return data.type === "file";
            },
            mtime: (new Date(data.lastmod)).getTime(),
            name: data.basename,
            size: data.size || 0
        };
    }

    async stat(filename) {
        const stat = await this.wdc.stat(filename);
        return this._convertStat(stat);
    }

    async writeFile(filename, data) {
        return await this.wdc.putFileContents(filename, data, { maxContentLength: this.config.maxContentLength })
    }

    async unlink(filename) {
        return await this.wdc.deleteFile(filename);
    }

    async readFile(filename) {
        return await this.wdc.getFileContents(filename, { maxContentLength: this.config.maxContentLength })
    }

    async mkdir(dirname) {
        return await this.wdc.createDirectory(dirname);
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