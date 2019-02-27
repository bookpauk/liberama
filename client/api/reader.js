import axios from 'axios';
import {sleep} from '../share/utils';

const api = axios.create({
  baseURL: '/api/reader'
});

const workerApi = axios.create({
  baseURL: '/api/worker'
});

class Reader {
    async loadBook(url, callback) {
        const refreshPause = 300;
        if (!callback) callback = () => {};

        let response = await api.post('/load-book', {type: 'url', url});

        const workerId = response.data.workerId;
        if (!workerId)
            throw new Error('Неверный ответ api');

        callback({totalSteps: 4});

        let i = 0;
        while (1) {// eslint-disable-line no-constant-condition
            callback(response.data);

            if (response.data.state == 'finish') {//воркер закончил работу, можно скачивать кешированный на сервере файл
                callback({step: 4});
                const book = await this.loadCachedBook(response.data.path, callback);
                return Object.assign({}, response.data, {data: book.data});
            }
            if (response.data.state == 'error') {
                let errMes = response.data.error;
                if (errMes.indexOf('getaddrinfo') >= 0 || 
                    errMes.indexOf('ECONNRESET') >= 0 ||
                    errMes.indexOf('EINVAL') >= 0 ||
                    errMes.indexOf('404') >= 0)
                    errMes = `Ресурс не найден по адресу: ${response.data.url}`;
                throw new Error(errMes);
            }
            if (i > 0)
                await sleep(refreshPause);

            i++;
            if (i > 120*1000/refreshPause) {//2 мин ждем телодвижений воркера
                throw new Error('Слишком долгое время ожидания');
            }
            //проверка воркера
            const prevProgress = response.data.progress;
            response = await workerApi.post('/get-state', {workerId});
            i = (prevProgress != response.data.progress ? 1 : i);
        }
    }

    async loadCachedBook(url, callback){
        const response = await axios.head(url);

        let estSize = 1000000;
        if (response.headers['content-length']) {
            estSize = response.headers['content-length'];
        }

        const options = {
            onDownloadProgress: progress => {
                while (progress.loaded > estSize) estSize *= 1.5;

                if (callback)
                    callback({state: 'loading', progress: Math.round((progress.loaded*100)/estSize)});
            }
        }
        //загрузка
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
}

export default new Reader();