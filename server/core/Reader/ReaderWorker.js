const fs = require('fs-extra');
const path = require('path');

const LimitedQueue = require('../LimitedQueue');
const WorkerState = require('../WorkerState');//singleton
const FileDownloader = require('../FileDownloader');
const FileDecompressor = require('../FileDecompressor');
const BookConverter = require('./BookConverter');
const RemoteStorage = require('../RemoteStorage');
const JembaConnManager = require('../../db/JembaConnManager');//singleton
const ayncExit = new (require('../AsyncExit'))();

const utils = require('../utils');
const log = new (require('../AppLogger'))().log;//singleton

const cleanDirPeriod = 60*60*1000;//каждый час
const remoteSendPeriod = 119*1000;//примерно раз 2 минуты

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

            this.connManager = new JembaConnManager();
            this.appDb = this.connManager.db['app'];

            this.remoteStorage = false;
            if (config.remoteStorage) {
                this.remoteStorage = new RemoteStorage(
                    Object.assign({maxContentLength: 3*config.maxUploadFileSize}, config.remoteStorage)
                );
            }

            this.dirConfigArr = [
                {
                    dir: this.config.tempPublicDir,
                    remoteDir: '/tmp',
                    maxSize: this.config.maxTempPublicDirSize,
                    moveToRemote: true,
                },
                {
                    dir: this.config.uploadDir,
                    remoteDir: '/upload',
                    maxSize: this.config.maxUploadPublicDirSize,
                    moveToRemote: true,
                }
            ];
            //преобразуем в объект для большего удобства
            this.dirConfig = {};
            for (const configRec of this.dirConfigArr)
                this.dirConfig[configRec.remoteDir] = configRec;

            this.remoteFilesToSend = [];
            this.periodicCleanDir();//no await
            
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

            //асинхронно через 30 сек добавим в очередь на отправку
            //т.к. gzipFileIfNotExists может переупаковать файл
            (async() => {
                await utils.sleep(30*1000);
                this.pushRemoteSend(compFilename, '/tmp');
            })();

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
            this.pushRemoteSend(outFilename, '/upload');
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
            this.pushRemoteSend(outFilename, '/upload');
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
        if (this.dirConfig[remoteDir])
            targetDir = this.dirConfig[remoteDir].dir;
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

    pushRemoteSend(fileName, remoteDir) {
        if (this.remoteStorage
            && this.dirConfig[remoteDir] 
            && this.dirConfig[remoteDir].moveToRemote) {
            this.remoteFilesToSend.push({fileName, remoteDir});
        }
    }

    async remoteSendFile(sendFileRec) {
        const {fileName, remoteDir} = sendFileRec;
        const sent = this.remoteSent;

        if (!fileName || sent[fileName])
            return;

        log(`remoteSendFile ${remoteDir}/${path.basename(fileName)}`);

        //отправляем в remoteStorage
        await this.remoteStorage.putFile(fileName, remoteDir);
        
        sent[fileName] = true;
        await this.appDb.insert({table: 'remote_sent', ignore: true, rows: [{id: fileName, remoteDir}]});
    }

    async remoteSendAll() {
        if (!this.remoteStorage)
            return;

        const newSendQueue = [];
        while (this.remoteFilesToSend.length) {
            const sendFileRec = this.remoteFilesToSend.shift();

            if (sendFileRec.remoteDir
                && this.dirConfig[sendFileRec.remoteDir]
                && this.dirConfig[sendFileRec.remoteDir].moveToRemote) {

                try {
                    await this.remoteSendFile(sendFileRec);
                } catch (e) {
                    newSendQueue.push(sendFileRec)
                    log(LM_ERR, e.stack);
                }
            }
        }

        this.remoteFilesToSend = newSendQueue;
    }

    async cleanDir(config) {
        const {dir, remoteDir, maxSize, moveToRemote} = config;
        const sent = this.remoteSent;

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

        log(LM_WARN, `clean dir ${dir}, maxSize=${maxSize}, found ${files.length} files, total size=${size}`);

        files.sort((a, b) => a.stat.mtimeMs - b.stat.mtimeMs);

        //удаленное хранилище
        if (moveToRemote && this.remoteStorage) {
            const foundFiles = new Set();
            for (const file of files) {
                foundFiles.add(file.name);

                //отсылаем на всякий случай перед удалением, если вдруг remoteSendAll не справился
                try {
                    await this.remoteSendFile({fileName: file.name, remoteDir});
                } catch (e) {
                    log(LM_ERR, e.stack);
                }
            }

            //почистим remoteSent и БД
            //несколько неоптимально, таскает все записи из таблицы
            const rows = await this.appDb.select({table: 'remote_sent'});
            for (const row of rows) {
                if ((row.remoteDir === remoteDir && !foundFiles.has(row.id))
                    || !this.dirConfig[row.remoteDir]) {
                    delete sent[row.id];
                    await this.appDb.delete({table: 'remote_sent', where: `@@id(${this.appDb.esc(row.id)})`});
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
                j++;
            }
            
            size -= file.stat.size;
            i++;
        }

        log(LM_WARN, `removed ${j} files`);
    }

    async periodicCleanDir() {
        try {
            if (!this.remoteSent)
                this.remoteSent = {};

            //инициализация this.remoteSent
            if (this.remoteStorage) {
                const rows = await this.appDb.select({table: 'remote_sent'});
                for (const row of rows) {
                    this.remoteSent[row.id] = true;
                }
            }

            let lastCleanDirTime = 0;
            let lastRemoteSendTime = 0;
            while (1) {// eslint-disable-line no-constant-condition
                //отсылка в удаленное хранилище
                if (Date.now() - lastRemoteSendTime >= remoteSendPeriod) {
                    try {
                        await this.remoteSendAll();
                    } catch(e) {
                        log(LM_ERR, e.stack);
                    }

                    lastRemoteSendTime = Date.now();
                }

                //чистка папок
                if (Date.now() - lastCleanDirTime >= cleanDirPeriod) {
                    for (const config of Object.values(this.dirConfig)) {
                        try {
                            await this.cleanDir(config);
                        } catch(e) {
                            log(LM_ERR, e.stack);
                        }
                    }

                    lastCleanDirTime = Date.now();
                }

                await utils.sleep(60*1000);//интервал проверки 1 минута
            }
        } catch (e) {
            log(LM_FATAL, e.message);
            ayncExit.exit(1);
        }
    }

}

module.exports = ReaderWorker;