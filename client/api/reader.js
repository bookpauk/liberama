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
        let response = await api.post('/load-book', {type: 'url', url});

        const workerId = response.data.workerId;
        if (!workerId)
            throw new Error('Неверный ответ api');

        let i = 0;
        while (1) {// eslint-disable-line no-constant-condition
            if (callback)
                callback(response.data);
            if (response.data.state == 'finish') {
                let book = await axios.get(response.data.path, {});
                return Object.assign({}, response.data, {data: book.data});
            }
            if (response.data.state == 'error') {
                throw new Error(response.data.error);
            }
            if (i > 0)
                await sleep(500);

            i++;
            if (i > 60) {
                throw new Error('Слишком долгое время ожидания');
            }
            response = await workerApi.post('/get-state', {workerId});
        }
    }
}

export default new Reader();