import axios from 'axios';

const api = axios.create({
    baseURL: '/api/reader'
});

const workerApi = axios.create({
    baseURL: '/api/worker'
});

class Reader {

    async getStateFinish(workerId, callback) {
        if (!callback) callback = () => {};

        //присылается текст, состоящий из json-объектов state каждые 300ms, с разделителем splitter между ними
        const splitter = '-- aod2t5hDXU32bUFyqlFE next status --';
        let lastIndex = 0;
        let response = await workerApi.post('/get-state-finish', {workerId}, {
            onDownloadProgress: progress => {
                //небольая оптимизация, вместо простого responseText.split
                const xhr = progress.target;
                let currIndex = xhr.responseText.length;
                if (lastIndex == currIndex)
                    return; 
                const last = xhr.responseText.substring(lastIndex, currIndex);
                lastIndex = currIndex;

                //быстрее будет last.split
                const res = last.split(splitter).pop();
                if (res) {
                    try {
                        callback(JSON.parse(res));
                    } catch (e) {
                        //
                    }
                }
            }
        });

        //берем последний state
        response = response.data.split(splitter).pop();

        if (response) {
            try {
                response = JSON.parse(response);
            } catch (e) {
                response = false;
            }
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
                const book = await this.loadCachedBook(response.path, callback);
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
        return await axios.head(url, {headers: {'Cache-Control': 'no-cache'}});
    }

    async loadCachedBook(url, callback) {
        const response = await axios.head(url, {headers: {'Cache-Control': 'no-cache'}});

        let estSize = 1000000;
        if (response.headers['content-length']) {
            estSize = response.headers['content-length'];
        }

        callback({state: 'loading', progress: 0});
        const options = {
            onDownloadProgress: progress => {
                while (progress.loaded > estSize) estSize *= 1.5;

                if (callback)
                    callback({progress: Math.round((progress.loaded*100)/estSize)});
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

    async storage(request) {
        let response = await api.post('/storage', request);

        const state = response.data.state;
        if (!state)
            throw new Error('Неверный ответ api');

        return response.data;
    }
}

export default new Reader();