const fs = require('fs-extra');
const path = require('path');
const ZipStreamer = require('../ZipStreamer');

const utils = require('../utils');

class MegaStorage {
    constructor() {
        this.inited = false;
    }

    async init(config) {
        this.config = config;
        this.megaStorageDir = config.megaStorageDir;
        this.statsPath = `${this.megaStorageDir}/stats.json`;
        this.compressLevel = (config.compressLevel ? config.compressLevel : 4);
        await fs.ensureDir(this.megaStorageDir);

        this.readingFiles = false;
        this.stats = {};

        if (await fs.pathExists(this.statsPath)) {
            this.stats = Object.assign({},
                JSON.parse(await fs.readFile(this.statsPath, 'utf8')),
                this.stats
            );
        }

        this.inited = true;
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

    async _findFiles(callback, dir) {
        if (!callback || !this.readingFiles)
            return;
        if (!dir)
            dir = this.megaStorageDir;

        let result;
        const files = await fs.readdir(dir, { withFileTypes: true });
        for (const file of files) {
            if (!this.readingFiles)
                return;
            const found = path.resolve(dir, file.name);
            if (file.isDirectory())
                result = await this._findFiles(callback, found);
            else
                callback(found);
        }
        return result;
    }

    async startFindFiles(callback, dir) {
        this.readingFiles = true;
        try {
            return await this._findFiles(callback, dir);
        } finally {
            this.readingFiles = false;
        }
    }

    async stopFindFiles() {
        this.readingFiles = false;
    }

    async getStats(gather = false) {
    }
}

module.exports = MegaStorage;