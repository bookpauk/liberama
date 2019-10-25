const fs = require('fs-extra');
const crypto = require('crypto');

const utils = require('../utils');

class LibSharedStorage {
    constructor() {
        this.readingFiles = false;
    }

    async init(config) {
        this.config = config;
        this.lssDir = `${config.sharedDir}/lss`;
        await fs.ensureDir(this.lssDir);
    }

    storageNameToPath(storageFilename) {
        if (storageFilename.length < 4)
            throw new Error('LibSharedStorage: ошибка в имени файла');
        return `${storageFilename.substr(0, 2)}/${storageFilename.substr(2, 2)}/${storageFilename}`;
    }

    async filenameToStoragePath(filename) {
        const base36hash = utils.toBase36(await utils.getFileHash(filename, 'sha1'));
    }

    async checkFile(filename) {
    }

    async addFile(filename, desc) {
    }

    async addFileFromArchive(archiveFilename, deompFiles, desc) {
    }

    async updateFileDesc(storagePath, desc) {
    }

    async getAuthorPath(authorName) {
    }

    async checkAuthor(authorName) {
    }

    async addAuthor(authorName, desc) {
    }

    async readFiles(callback) {
    }

    async stopReadFiles() {
    }

    async getFilesStatistic() {
    }
}

module.exports = LibSharedStorage;