const fs = require('fs-extra');
const path = require('path');
const ZipStreamer = require('../ZipStreamer');

const utils = require('../utils');

class MegaStorage {
    constructor() {
        this.readingFiles = false;
        this.stats = null;
    }

    async init(config) {
        this.config = config;
        this.megaStorageDir = config.megaStorageDir;
        this.compressLevel = (config.compressLevel ? config.compressLevel : 4);
        await fs.ensureDir(this.megaStorageDir);
    }

    async nameHash(filename) {
        const hash = utils.toBase36(await utils.getFileHash(filename, 'sha1'));
        const hashPath = `${hash.substr(0, 2)}/${hash.substr(2, 2)}/${hash}`;
        const fullHashPath = `${this.megaStorageDir}/${hashPath}`;
        return {
            filename,
            hash,
            hashPath,
            fullHashPath,
            zipPath: `${fullHashPath}.zip`,
            descPath: `${fullHashPath}.desc`,
        };
    }

    async checkFileExists(nameHash) {
        return await fs.pathExists(nameHash.zipPath);
    }

    async addFile(nameHash, desc = null, force = false) {
        if (await this.checkFileExists(nameHash) && !force)
            return false;

        await fs.ensureDir(path.dirname(nameHash.zipPath));
        const zip = new ZipStreamer();
        let entry = {};
        let resultFile = await zip.pack(nameHash.zipPath, [nameHash.filename], {zlib: {level: this.compressLevel}}, (ent) => {
            entry = ent;
        });

        if (desc) {
            desc = Object.assign({}, desc, {fileSize: entry.size, zipFileSize: resultFile.size});
            this.updateDesc(nameHash, desc);
        }
        return desc;
    }

    async updateDesc(nameHash, desc) {
        await fs.writeFile(nameHash.descPath, JSON.stringify(desc, null, 2));
    }

    async readFiles(callback, dir) {
        if (!callback)
            return;
        if (!dir)
            dir = this.megaStorageDir;

        const files = await fs.readdir(dir, { withFileTypes: true });
        for (const file of files) {
            const found = path.resolve(dir, file.name);
            if (file.isDirectory())
                await this.readFiles(callback, found);
            else
                callback(found);
        }
    }

    async stopReadFiles() {
    }

    async getStats(gather = false) {
    }
}

module.exports = MegaStorage;