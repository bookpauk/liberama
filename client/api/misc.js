import axios from 'axios';

class Misc {
    async getConfig() {
        const response = await axios.post('/api/config', {params: ['name', 'version']});
        return response.data;
    }
}

let misc = null;
if (!misc) {
    misc = new Misc();
}

export default misc;