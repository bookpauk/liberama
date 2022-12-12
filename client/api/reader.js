import axios from 'axios';
import * as utils from '../share/utils';
import * as cryptoUtils from '../share/cryptoUtils';
import wsc from './webSocketConnection';

const api = axios.create({
    baseURL: '/api/reader'
});

/*const workerApi = axios.create({
    baseURL: '/api/worker'
});*/

class Reader {
    constructor() {
    }

    async getWorkerStateFinish(workerId, callback) {
        if (!callback) callback = () => {};

        let response = {};
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
    }

    async loadBook(opts, callback) {
        if (!callback) callback = () => {};

        let response = await wsc.message(await wsc.send(Object.assign({action: 'load-book'}, opts)));
        const workerId = response.workerId;
        if (!workerId)
            throw new Error('Неверный ответ api');

        callback({totalSteps: 4});
        callback(response);

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
            //
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

    async uploadFile(file, maxUploadFileSize = 10*1024*1024, callback) {
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
        const response = await wsc.message(await wsc.send({action: 'reader-storage', body: request}));

        if (response.error)
            throw new Error(response.error);

        if (!response.state)
            throw new Error('Неверный ответ api');

        return response;
    }

    makeUrlFromBuf(buf) {
        const key = utils.toHex(cryptoUtils.sha256(buf));
        return `disk://${key}`;
    }

    async uploadFileBuf(buf, url) {
        if (!url)
            url = this.makeUrlFromBuf(buf);

        let response;
        try {
            await axios.head(url.replace('disk://', '/upload/'), {headers: {'Cache-Control': 'no-cache'}});
            response = await wsc.message(await wsc.send({action: 'upload-file-touch', url}));
        } catch (e) {
            response = await wsc.message(await wsc.send({action: 'upload-file-buf', buf}));
        }

        if (response.error)
            throw new Error(response.error);

        return response;
    }

    async getUploadedFileBuf(url) {
        url = url.replace('disk://', '/upload/');
        return (await axios.get(url)).data;
    }

    async checkBuc(bookUrls) {
        const response = await wsc.message(await wsc.send({action: 'check-buc', bookUrls}));

        if (response.error)
            throw new Error(response.error);

        if (!response.data)
            throw new Error(`response.data is empty`);

        return response.data;
    }
}

export default new Reader();