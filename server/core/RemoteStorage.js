const fs = require('fs-extra');
const path = require('path');

const WebSocketConnection = require('./WebSocketConnection');

class RemoteStorage {
    constructor(config) {
        this.config = Object.assign({}, config);
        this.config.maxContentLength = this.config.maxContentLength || 10*1024*1024;

        this.accessToken = this.config.accessToken;

        this.wsc = new WebSocketConnection(config.url);
    }

    async wsQuery(query) {
        const response = await this.wsc.message(
            await this.wsc.send(Object.assign({accessToken: this.accessToken}, query), 600),
            600
        );
        if (response.error)
            throw new Error(response.error);
        return response;
    }

    async wsStat(fileName) {
        return await this.wsQuery({action: 'get-stat', fileName});
    }

    async wsGetFile(fileName) {
        return this.wsQuery({action: 'get-file', fileName});
    }

    async wsPutFile(fileName, data) {//data base64 encoded string
        return this.wsQuery({action: 'put-file', fileName, data});
    }

    async wsDelFile(fileName) {
        return this.wsQuery({action: 'del-file', fileName});
    }

    makeRemoteFileName(fileName, dir = '') {
        const base = path.basename(fileName);
        if (base.length > 3) {
            return `${dir}/${base.substr(0, 3)}/${base}`;
        } else {
            return `${dir}/${base}`;
        }
    }

    async putFile(fileName, dir = '') {
        if (!await fs.pathExists(fileName)) {
            throw new Error(`File not found: ${fileName}`);
        }

        const remoteFilename = this.makeRemoteFileName(fileName, dir);

        try {
            const localStat = await fs.stat(fileName);
            let remoteStat = await this.wsStat(remoteFilename);
            remoteStat = remoteStat.stat;

            if (remoteStat.isFile && localStat.size == remoteStat.size) {
                return;
            }

            await this.wsDelFile(remoteFilename);
        } catch (e) {
            //
        }

        const data = await fs.readFile(fileName, 'base64');
        await this.wsPutFile(remoteFilename, data);
    }

    async getFile(fileName, dir = '') {
        if (await fs.pathExists(fileName)) {
            return;
        }

        const remoteFilename = this.makeRemoteFileName(fileName, dir);

        const response = await this.wsGetFile(remoteFilename);
        await fs.writeFile(fileName, response.data, 'base64');
    }

    async getFileSuccess(filename, dir = '') {
        try {
            await this.getFile(filename, dir);
            return true;
        } catch (e) {
            //
        }
        return false;
    }
}

module.exports = RemoteStorage;