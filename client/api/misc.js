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
            const config = await wsc.message(await wsc.send(Object.assign({action: 'get-config'}, query)));
            if (config.error)
                throw new Error(config.error);
            return config;
        } catch (e) {
            console.error(e);
        }

        //если с WebSocket проблема, работаем по http
        const response = await api.post('/config', query);
        return response.data;
    }
}

export default new Misc();