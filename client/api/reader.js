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
        const refreshPause = 200;
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
            if (i > 30*1000/refreshPause) {//30 сек ждем телодвижений воркера
                throw new Error('Слишком долгое время ожидания');
            }
            //проверка воркера
            const prevProgress = response.data.progress;
            response = await workerApi.post('/get-state', {workerId});
            i = (prevProgress != response.data.progress ? 1 : i);
        }
    }

    async loadCachedBook(url, callback){
        const options = {
            onDownloadProgress: progress => {
                if (callback)
                    callback({state: 'loading', step: 4, progress: Math.round((progress.loaded*100)/progress.total)});
            }
        }
        //загрузка
        return await axios.get(url, options);
    }
}

export default new Reader();