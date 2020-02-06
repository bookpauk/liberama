const _ = require('lodash');
const fs = require('fs-extra');
const path = require('path');

const log = new (require('../AppLogger'))().log;//singleton
const ZipStreamer = require('../Zip/ZipStreamer');

const utils = require('../utils');

const zeroStats = {
    zipFilesCount: 0,
    descFilesCount: 0,
    zipFilesSize: 0,
    descFilesSize: 0,
};

let instance = null;

//singleton
class MegaStorage {
    constructor() {
        if (!instance) {
            this.inited = false;

            this.debouncedSaveStats = _.debounce(() => {
                this.saveStats().catch((e) => {
                    log(LM_ERR, `MegaStorage::saveStats ${e.message}`);
                    //process.exit(1);
                });
            }, 5000, {'maxWait':6000});

            process.on('exit', () => {
                this.saveStatsSync();
            });


            instance = this;
        }

        return instance;
    }

    async init(config) {
        this.config = config;
        this.megaStorageDir = config.megaStorageDir;
        this.statsPath = `${this.megaStorageDir}/stats.json`;
        this.compressLevel = (config.compressLevel ? config.compressLevel : 4);
        await fs.ensureDir(this.megaStorageDir);

        this.readingFiles = false;
        this.stats = _.cloneDeep(zeroStats);

        if (await fs.pathExists(this.statsPath)) {
            this.stats = Object.assign({},
                this.stats,
                JSON.parse(await fs.readFile(this.statsPath, 'utf8'))
            );
        }

        this.inited = true;
    }

    async nameHash(filename) {
        if (!this.inited)
            throw new Error('not inited');
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
        if (!this.inited)
            throw new Error('not inited');
        if (await this.checkFileExists(nameHash) && !force)
            return false;

        await fs.ensureDir(path.dirname(nameHash.zipPath));
        let oldZipSize = 0;
        let newZipCount = 1;
        if (await fs.pathExists(nameHash.zipPath)) {
            oldZipSize = (await fs.stat(nameHash.zipPath)).size;
            newZipCount = 0;
        }

        const zip = new ZipStreamer();
        let entry = {};
        let resultFile = await zip.pack(nameHash.zipPath, [nameHash.filename], {zlib: {level: this.compressLevel}}, (ent) => {
            entry = ent;
        });

        if (desc) {
            desc = Object.assign({}, desc, {fileSize: entry.size, zipFileSize: resultFile.size});
            await this.updateDesc(nameHash, desc);
        }

        this.stats.zipFilesSize += -oldZipSize + resultFile.size;
        this.stats.zipFilesCount += newZipCount;
        this.needSaveStats = true;

        this.debouncedSaveStats();
        return desc;
    }

    async updateDesc(nameHash, desc) {
        let oldDescSize = 0;
        let newDescCount = 1;
        if (await fs.pathExists(nameHash.descPath)) {
            oldDescSize = (await fs.stat(nameHash.descPath)).size;
            newDescCount = 0;
        }

        const data = JSON.stringify(desc, null, 2);
        await fs.writeFile(nameHash.descPath, data);

        this.stats.descFilesSize += -oldDescSize + data.length;
        this.stats.descFilesCount += newDescCount;
        this.needSaveStats = true;

        this.debouncedSaveStats();
    }

    async _findFiles(callback, dir) {
        if (!callback || !this.readingFiles)
            return;

        let result = true;
        const files = await fs.readdir(dir, { withFileTypes: true });
        for (const file of files) {
            if (!this.readingFiles)
                return;
            const found = path.resolve(dir, file.name);
            if (file.isDirectory())
                result = await this._findFiles(callback, found);
            else
                await callback(found);
        }
        return result;
    }

    async startFindFiles(callback) {
        if (!this.inited)
            throw new Error('not inited');
        this.readingFiles = true;
        try {
            return await this._findFiles(callback, this.megaStorageDir);
        } finally {
            this.readingFiles = false;
        }
    }

    async stopFindFiles() {
        this.readingFiles = false;
    }

    async saveStats() {
        if (this.needSaveStats) {
            await fs.writeFile(this.statsPath, JSON.stringify(this.stats, null, 2));
            this.needSaveStats = false;
        }
    }

    saveStatsSync() {
        if (this.needSaveStats) {
            fs.writeFileSync(this.statsPath, JSON.stringify(this.stats, null, 2));
            this.needSaveStats = false;
        }
    }

    async getStats(gather = false) {
        if (!this.inited)
            throw new Error('MegaStorage::not inited');
        if (!gather || this.readingFiles)
            return this.stats;

        let stats = _.cloneDeep(zeroStats);
        const result = await this.startFindFiles(async(entry) => {
            if (path.extname(entry) == '.zip') {
                stats.zipFilesSize += (await fs.stat(entry)).size;
                stats.zipFilesCount++;
            }

            if (path.extname(entry) == '.desc') {
                stats.descFilesSize += (await fs.stat(entry)).size;
                stats.descFilesCount++;
            }
        });

        if (result) {
            this.stats = stats;
            this.needSaveStats = true;
            this.debouncedSaveStats();
        }
        return this.stats;
    }
}

module.exports = MegaStorage;