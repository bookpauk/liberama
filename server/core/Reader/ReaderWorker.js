const fs = require('fs-extra');
const path = require('path');

const LimitedQueue = require('../LimitedQueue');
const WorkerState = require('../WorkerState');//singleton
const FileDownloader = require('../FileDownloader');
const FileDecompressor = require('../FileDecompressor');
const BookConverter = require('./BookConverter');
const RemoteStorage = require('../RemoteStorage');

const utils = require('../utils');
const log = new (require('../AppLogger'))().log;//singleton

const cleanDirPeriod = 30*60*1000;//раз в полчаса
const queue = new LimitedQueue(5, 100, 2*60*1000 + 15000);//2 минуты ожидание подвижек

let instance = null;

//singleton
class ReaderWorker {
    constructor(config) {
        if (!instance) {
            this.config = Object.assign({}, config);
            
            this.config.tempDownloadDir = `${config.tempDir}/download`;
            fs.ensureDirSync(this.config.tempDownloadDir);

            this.config.tempPublicDir = `${config.publicDir}/tmp`;
            fs.ensureDirSync(this.config.tempPublicDir);

            this.workerState = new WorkerState();
            this.down = new FileDownloader(config.maxUploadFileSize);
            this.decomp = new FileDecompressor(3*config.maxUploadFileSize);
            this.bookConverter = new BookConverter(this.config);

            this.remoteStorage = false;
            if (config.remoteStorage) {
                this.remoteStorage = new RemoteStorage(
                    Object.assign({maxContentLength: 3*config.maxUploadFileSize}, config.remoteStorage)
                );
            }

            this.remoteConfig = {
                '/tmp': {
                    dir: this.config.tempPublicDir,
                    maxSize: this.config.maxTempPublicDirSize,
                    moveToRemote: true,
                },
                '/upload': {
                    dir: this.config.uploadDir,
                    maxSize: this.config.maxUploadPublicDirSize,
                    moveToRemote: true,
                }
            };

            this.periodicCleanDir(this.remoteConfig);//no await
            
            instance = this;
        }

        return instance;
    }

    async loadBook(opts, wState) {
        const url = opts.url;
        let decompDir = '';
        let downloadedFilename = '';
        let isUploaded = false;
        let convertFilename = '';

        const overLoadMes = 'Слишком большая очередь загрузки. Пожалуйста, попробуйте позже.';
        const overLoadErr = new Error(overLoadMes);

        let q = null;
        try {
            wState.set({state: 'queue', step: 1, totalSteps: 1});
            try {
                let qSize = 0;
                q = await queue.get((place) => {
                    wState.set({place, progress: (qSize ? Math.round((qSize - place)/qSize*100) : 0)});
                    if (!qSize)
                        qSize = place;
                });
            } catch (e) {
                throw overLoadErr;
            }

            wState.set({state: 'download', step: 1, totalSteps: 3, url});

            const tempFilename = utils.randomHexString(30);
            const tempFilename2 = utils.randomHexString(30);
            const decompDirname = utils.randomHexString(30);

            //download or use uploaded
            if (url.indexOf('disk://') != 0) {//download
                const downdata = await this.down.load(url, (progress) => {
                    wState.set({progress});
                }, q.abort);

                downloadedFilename = `${this.config.tempDownloadDir}/${tempFilename}`;
                await fs.writeFile(downloadedFilename, downdata);
            } else {//uploaded file
                const fileHash = url.substr(7);
                downloadedFilename = `${this.config.uploadDir}/${fileHash}`;
                if (!await fs.pathExists(downloadedFilename)) {
                    //если удалено из upload, попробуем восстановить из удаленного хранилища
                    try {
                        await this.restoreRemoteFile(fileHash, '/upload');
                    } catch(e) {
                        throw new Error('Файл не найден на сервере (возможно был удален как устаревший). Пожалуйста, загрузите файл с диска на сервер заново.');
                    }
                }
                await utils.touchFile(downloadedFilename);
                isUploaded = true;
            }
            wState.set({progress: 100});

            if (q.abort())
                throw overLoadErr;
            q.resetTimeout();

            //decompress
            wState.set({state: 'decompress', step: 2, progress: 0});
            decompDir = `${this.config.tempDownloadDir}/${decompDirname}`;
            let decompFiles = {};
            try {
                decompFiles = await this.decomp.decompressNested(downloadedFilename, decompDir);
            } catch (e) {
                log(LM_ERR, e.stack);
                throw new Error('Ошибка распаковки');
            }
            wState.set({progress: 100});
            
            if (q.abort())
                throw overLoadErr;
            q.resetTimeout();

            //конвертирование в fb2
            wState.set({state: 'convert', step: 3, progress: 0});
            convertFilename = `${this.config.tempDownloadDir}/${tempFilename2}`;
            await this.bookConverter.convertToFb2(decompFiles, convertFilename, opts, progress => {
                wState.set({progress});
                if (queue.freed > 0)
                    q.resetTimeout();
            }, q.abort);

            //сжимаем файл в tmp, если там уже нет с тем же именем-sha256
            const compFilename = await this.decomp.gzipFileIfNotExists(convertFilename, this.config.tempPublicDir);
            const stat = await fs.stat(compFilename);

            wState.set({progress: 100});

            //finish
            const finishFilename = path.basename(compFilename);
            wState.finish({path: `/tmp/${finishFilename}`, size: stat.size});

        } catch (e) {
            log(LM_ERR, e.stack);
            let mes = e.message.split('|FORLOG|');
            if (mes[1])
                log(LM_ERR, mes[0] + mes[1]);
            log(LM_ERR, `downloadedFilename: ${downloadedFilename}`);

            mes = mes[0];
            if (mes == 'abort')
                mes = overLoadMes;
            wState.set({state: 'error', error: mes});
        } finally {
            //clean
            if (q)
                q.ret();
            if (decompDir)
                await fs.remove(decompDir);
            if (downloadedFilename && !isUploaded)
                await fs.remove(downloadedFilename);
            if (convertFilename)
                await fs.remove(convertFilename);
        }
    }

    loadBookUrl(opts) {
        const workerId = this.workerState.generateWorkerId();
        const wState = this.workerState.getControl(workerId);
        wState.set({state: 'start'});

        this.loadBook(opts, wState);

        return workerId;
    }

    async saveFile(file) {
        const hash = await utils.getFileHash(file.path, 'sha256', 'hex');
        const outFilename = `${this.config.uploadDir}/${hash}`;

        if (!await fs.pathExists(outFilename)) {
            await fs.move(file.path, outFilename);
        } else {
            await utils.touchFile(outFilename);
            await fs.remove(file.path);
        }

        return `disk://${hash}`;
    }

    async saveFileBuf(buf) {
        const hash = await utils.getBufHash(buf, 'sha256', 'hex');
        const outFilename = `${this.config.uploadDir}/${hash}`;

        if (!await fs.pathExists(outFilename)) {
            await fs.writeFile(outFilename, buf);
        } else {
            await utils.touchFile(outFilename);
        }

        return `disk://${hash}`;
    }

    async uploadFileTouch(url) {
        const outFilename = `${this.config.uploadDir}/${url.replace('disk://', '')}`;

        await utils.touchFile(outFilename);

        return url;
    }

    async restoreRemoteFile(filename, remoteDir) {
        let targetDir = '';
        if (this.remoteConfig[remoteDir])
            targetDir = this.remoteConfig[remoteDir].dir;
        else
            throw new Error(`restoreRemoteFile: unknown remoteDir value (${remoteDir})`);

        const basename = path.basename(filename);
        const targetName = `${targetDir}/${basename}`;

        if (!await fs.pathExists(targetName)) {
            let found = false;
            if (this.remoteStorage) {
                found = await this.remoteStorage.getFileSuccess(targetName, remoteDir);
            }

            if (!found) {
                throw new Error('404 Файл не найден');
            }
        }

        return targetName;
    }

    async cleanDir(dir, remoteDir, maxSize, moveToRemote) {
        if (!this.remoteSent)
            this.remoteSent = {};
        if (!this.remoteSent[remoteDir])
            this.remoteSent[remoteDir] = {};

        const sent = this.remoteSent[remoteDir];

        const list = await fs.readdir(dir);

        let size = 0;
        let files = [];
        for (const filename of list) {
            const filePath = `${dir}/${filename}`;
            const stat = await fs.stat(filePath);
            if (!stat.isDirectory()) {
                size += stat.size;
                files.push({name: filePath, stat});
            }
        }
        log(`clean dir ${dir}, maxSize=${maxSize}, found ${files.length} files, total size=${size}`);

        files.sort((a, b) => a.stat.mtimeMs - b.stat.mtimeMs);

        if (moveToRemote && this.remoteStorage) {
            for (const file of files) {
                if (sent[file.name])
                    continue;

                //отправляем в remoteStorage
                try {
                    log(`remoteStorage.putFile ${remoteDir}/${path.basename(file.name)}`);
                    await this.remoteStorage.putFile(file.name, remoteDir);
                    sent[file.name] = true;
                } catch (e) {
                    log(LM_ERR, e.stack);
                }
            }
        }

        let i = 0;
        let j = 0;
        while (i < files.length && size > maxSize) {
            const file = files[i];
            const oldFile = file.name;

            //реально удаляем только если сохранили в хранилище или размер dir увеличен в 1.5 раза
            if (!(moveToRemote && this.remoteStorage)
                || (moveToRemote && this.remoteStorage && sent[oldFile])
                || size > maxSize*1.5) {
                await fs.remove(oldFile);
                delete sent[oldFile];
                j++;
            }
            
            size -= file.stat.size;
            i++;
        }
        log(`removed ${j} files`);
    }

    async periodicCleanDir(cleanConfig) {
        while (1) {// eslint-disable-line no-constant-condition
            for (const [remoteDir, config] of Object.entries(cleanConfig)) {
                try {
                    await this.cleanDir(config.dir, remoteDir, config.maxSize, config.moveToRemote);
                } catch(e) {
                    log(LM_ERR, e.stack);
                }
            }

            await utils.sleep(cleanDirPeriod);
        }
    }

}

module.exports = ReaderWorker;