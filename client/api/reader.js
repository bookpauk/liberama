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
        const refreshPause = 100;

        let response = await api.post('/load-book', {type: 'url', url});

        const workerId = response.data.workerId;
        if (!workerId)
            throw new Error('Неверный ответ api');

        let i = 0;
        while (1) {// eslint-disable-line no-constant-condition
            if (callback)
                callback(response.data);
            if (response.data.state == 'finish') {//воркер закончил работу, можно скачивать
                const options = {
                    onDownloadProgress: progress => {
                        if (callback)
                            callback(Object.assign({}, 
                                response.data, 
                                {state: 'loading', stage: 4, progress: Math.round((progress.loaded*100)/progress.total)}
                            ));
                    }
                }
                //загрузка
                const book = await axios.get(response.data.path, options);
                return Object.assign({}, response.data, {data: book.data});
            }
            if (response.data.state == 'error') {
                let errMes = response.data.error;
                if (errMes.indexOf('getaddrinfo') >= 0 || 
                    errMes.indexOf('ECONNRESET') >= 0 ||
                    errMes.indexOf('404') >= 0)
                    errMes = `Ресурс не найден по адресу: ${response.data.url}`;
                throw new Error(errMes);
            }
            if (i > 0)
                await sleep(refreshPause);

            i++;
            if (i > 30*1000/refreshPause) {
                throw new Error('Слишком долгое время ожидания');
            }
            //проверка воркера
            response = await workerApi.post('/get-state', {workerId});
        }
    }
}

export default new Reader();