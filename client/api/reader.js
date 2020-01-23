import axios from 'axios';
import * as utils from '../share/utils';
import wsc from './webSocketConnection';

const api = axios.create({
    baseURL: '/api/reader'
});

const workerApi = axios.create({
    baseURL: '/api/worker'
});

class Reader {
    constructor() {
    }

    async getStateFinish(workerId, callback) {
        if (!callback) callback = () => {};

        let response = {};

        try {
            await wsc.open();
            const requestId = wsc.send({action: 'worker-get-state-finish', workerId});

            while (1) {// eslint-disable-line no-constant-condition
                response = await wsc.message(requestId);
                callback(response);

                if (response.state == 'finish' || response.state == 'error') {
                    break;
                }
            }
            return response;
        } catch (e) {
            console.error(e);
        }

        //если WebSocket проблема, работаем по http
        const refreshPause = 500;
        let i = 0;
        response = {};
        while (1) {// eslint-disable-line no-constant-condition
            const prevProgress = response.progress || 0;
            const prevState = response.state || 0;
            response = await workerApi.post('/get-state', {workerId});
            response = response.data;
            callback(response);

            if (response.state == 'finish' || response.state == 'error') {
                break;
            }

            if (i > 0)
                await utils.sleep(refreshPause);

            i++;
            if (i > 120*1000/refreshPause) {//2 мин ждем телодвижений воркера
                throw new Error('Слишком долгое время ожидания');
            }
            //проверка воркера
            i = (prevProgress != response.progress || prevState != response.state ? 1 : i);
        }

        return response;
    }

    async loadBook(opts, callback) {
        if (!callback) callback = () => {};

        let response = await api.post('/load-book', opts);

        const workerId = response.data.workerId;
        if (!workerId)
            throw new Error('Неверный ответ api');

        callback({totalSteps: 4});
        callback(response.data);

        response = await this.getStateFinish(workerId, callback);

        if (response) {
            if (response.state == 'finish') {//воркер закончил работу, можно скачивать кешированный на сервере файл
                callback({step: 4});
                const book = await this.loadCachedBook(response.path, callback, false, (response.size ? response.size : -1));
                return Object.assign({}, response, {data: book.data});
            }

            if (response.state == 'error') {
                let errMes = response.error;
                if (errMes.indexOf('getaddrinfo') >= 0 || 
                    errMes.indexOf('ECONNRESET') >= 0 ||
                    errMes.indexOf('EINVAL') >= 0 ||
                    errMes.indexOf('404') >= 0)
                    errMes = `Ресурс не найден по адресу: ${response.url}`;
                throw new Error(errMes);
            }
        } else {
            throw new Error('Пустой ответ сервера');
        }
    }

    async checkUrl(url) {
        let fileExists = false;
        try {
            await axios.head(url, {headers: {'Cache-Control': 'no-cache'}});
            fileExists = true;
        } catch (e) {
            //
        }

        //восстановим при необходимости файл на сервере из удаленного облака
        if (!fileExists) {
            let response = await api.post('/restore-cached-file', {path: url});

            const workerId = response.data.workerId;
            if (!workerId)
                throw new Error('Неверный ответ api');

            response = await this.getStateFinish(workerId);
            if (response.state == 'error') {
                throw new Error(response.error);
            }
        }

        return true;
    }

    async loadCachedBook(url, callback, restore = true, estSize = -1) {
        if (!callback) callback = () => {};
        let response = null;

        callback({state: 'loading', progress: 0});

        //получение размера файла
        let fileExists = false;
        if (estSize < 0) {
            try {
                response = await axios.head(url, {headers: {'Cache-Control': 'no-cache'}});

                if (response.headers['content-length']) {
                    estSize = response.headers['content-length'];
                }
                fileExists = true;
            } catch (e) {
                //
            }
        }

        //восстановим при необходимости файл на сервере из удаленного облака
        if (restore && !fileExists) {
            response = await api.post('/restore-cached-file', {path: url});

            const workerId = response.data.workerId;
            if (!workerId)
                throw new Error('Неверный ответ api');

            response = await this.getStateFinish(workerId);
            if (response.state == 'error') {
                throw new Error(response.error);
            }

            if (response.size && estSize < 0) {
                estSize = response.size;
            }
        }

        //получение файла
        estSize = (estSize > 0 ? estSize : 1000000);
        const options = {
            onDownloadProgress: (progress) => {
                while (progress.loaded > estSize) estSize *= 1.5;

                if (callback)
                    callback({progress: Math.round((progress.loaded*100)/estSize)});
            }
        }

        return await axios.get(url, options);
    }

    async uploadFile(file, maxUploadFileSize, callback) {
        if (!maxUploadFileSize)
            maxUploadFileSize = 10*1024*1024;
        if (file.size > maxUploadFileSize)
            throw new Error(`Размер файла превышает ${maxUploadFileSize} байт`);

        let formData = new FormData();
        formData.append('file', file);

        const options = {
            headers: {
              'Content-Type': 'multipart/form-data'
            },
            onUploadProgress: progress => {
                const total = (progress.total ? progress.total : progress.loaded + 200000);
                if (callback)
                    callback({state: 'upload', progress: Math.round((progress.loaded*100)/total)});
            }

        };

        let response = await api.post('/upload-file', formData, options);
        if (response.data.state == 'error')
            throw new Error(response.data.error);

        const url = response.data.url;
        if (!url) 
            throw new Error('Неверный ответ api');

        return url;
    }

    async storage(request) {
        let response = await api.post('/storage', request);

        const state = response.data.state;
        if (!state)
            throw new Error('Неверный ответ api');

        return response.data;
    }
}

export default new Reader();