import axios from 'axios';
import wsc from './webSocketConnection';

const api = axios.create({
  baseURL: '/api'
});

class Misc {
    async loadConfig() {

        const query = {params: [
            'name', 'version', 'mode', 'maxUploadFileSize', 'useExternalBookConverter', 'branch',
        ]};

        try {
            await wsc.open();
            return await wsc.message(wsc.send(Object.assign({action: 'get-config'}, query)));
        } catch (e) {
            console.error(e);
        }

        //если WebSocket проблема, работаем по http
        const response = await api.post('/config', query);
        return response.data;
    }
}

export default new Misc();