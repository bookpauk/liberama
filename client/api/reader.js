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

    async getWorkerStateFinish(workerId, callback) {
        if (!callback) callback = () => {};

        let response = {};
        try {
            const requestId = await wsc.send({action: 'worker-get-state-finish', workerId});

            let prevResponse = false;
            while (1) {// eslint-disable-line no-constant-condition
                response = await wsc.message(requestId);

                if (!response.state && prevResponse !== false) {//экономия траффика
                    callback(prevResponse);
                } else {//были изменения worker state
                    if (!response.state)
                        throw new Error('Неверный ответ api');
                    callback(response);
                    prevResponse = response;
                }

                if (response.state == 'finish' || response.state == 'error') {
                    break;
                }
            }
            return response;
        } catch (e) {
            console.error(e);
        }

        //если с WebSocket проблема, работаем по http
        const refreshPause = 500;
        let i = 0;
        response = {};
        while (1) {// eslint-disable-line no-constant-condition
            const prevProgress = response.progress || 0;
            const prevState = response.state || 0;
            response = await workerApi.post('/get-state', {workerId});
            response = response.data;
            callback(response);

            if (!response.state)
                throw new Error('Неверный ответ api');

            if (response.state == 'finish' || response.state == 'error') {
                break;
            }

            if (i > 0)
                await utils.sleep(refreshPause);

            i++;
            if (i > 180*1000/refreshPause) {//3 мин ждем телодвижений воркера
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

        response = await this.getWorkerStateFinish(workerId, callback);

        if (response) {
            if (response.state == 'finish') {//воркер закончил работу, можно скачивать кешированный на сервере файл
                callback({step: 4});
                const book = await this.loadCachedBook(response.path, callback, response.size);
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

    async checkCachedBook(url) {
        let estSize = -1;
        try {
            const response = await axios.head(url, {headers: {'Cache-Control': 'no-cache'}});

            if (response.headers['content-length']) {
                estSize = response.headers['content-length'];
            }
        } catch (e) {
            //восстановим при необходимости файл на сервере из удаленного облака
            let response = null
            
            try {
                response = await wsc.message(await wsc.send({action: 'reader-restore-cached-file', path: url}));
            } catch (e) {
                console.error(e);
                //если с WebSocket проблема, работаем по http
                response = await api.post('/restore-cached-file', {path: url});
                response = response.data;
            }
            if (response.state == 'error') {
                throw new Error(response.error);
            }

            const workerId = response.workerId;
            if (!workerId)
                throw new Error('Неверный ответ api');

            response = await this.getWorkerStateFinish(workerId);
            if (response.state == 'error') {
                throw new Error(response.error);
            }
            if (response.size && estSize < 0) {
                estSize = response.size;
            }
        }

        return estSize;
    }

    async loadCachedBook(url, callback, estSize = -1) {
        if (!callback) callback = () => {};

        callback({state: 'loading', progress: 0});

        //получение размера файла
        if (estSize && estSize < 0) {
            estSize = await this.checkCachedBook(url);
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
        formData.append('file', file, file.name);

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
        let response = null;
        try {
            response = await wsc.message(await wsc.send({action: 'reader-storage', body: request}));
        } catch (e) {
            console.error(e);
            //если с WebSocket проблема, работаем по http
            response = await api.post('/storage', request);
            response = response.data;
        }

        const state = response.state;
        if (!state)
            throw new Error('Неверный ответ api');
        if (response.state == 'error') {
            throw new Error(response.error);
        }

        return response;
    }
}

export default new Reader();