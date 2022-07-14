import localForage from 'localforage';
//import _ from 'lodash';
import * as utils from '../../../share/utils';

const maxDataSize = 100*1024*1024;

const coversStore = localForage.createInstance({
    name: 'coversStorage'
});

class CoversStorage {
    constructor() {
    }

    async init() {
        this.cleanCovers(); //no await
    }

    async setData(key, data) {
        await coversStore.setItem(key, {addTime: Date.now(), data});
    }

    async getData(key) {
        const item = await coversStore.getItem(key);
        return (item ? item.data : undefined);
    }

    async removeData(key) {
        await coversStore.removeItem(key);
    }

    async cleanCovers() {
        await utils.sleep(10000);

        while (1) {// eslint-disable-line no-constant-condition
            let size = 0;
            let min = Date.now();
            let toDel = null;
            for (const key of (await coversStore.keys())) {
                const item = await coversStore.getItem(key);

                size += item.data.length;

                if (item.addTime < min) {
                    toDel = key;
                    min = item.addTime;
                }
            }


            if (size > maxDataSize && toDel) {
                await this.removeData(toDel);
            } else {
                break;
            }
        }
    }

}

export default new CoversStorage();