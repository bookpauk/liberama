import localForage from 'localforage';
//import _ from 'lodash';

const wpStore = localForage.createInstance({
    name: 'wallpaperStorage'
});

class WallpaperStorage {
    constructor() {
        this.cachedKeys = [];
    }

    async init() {
        this.cachedKeys = await wpStore.keys();
    }

    async getLength() {
        return await wpStore.length();
    }

    async setData(key, data) {
        await wpStore.setItem(key, data);
        this.cachedKeys = await wpStore.keys();
    }

    async getData(key) {
        return await wpStore.getItem(key);
    }

    async removeData(key) {
        await wpStore.removeItem(key);
        this.cachedKeys = await wpStore.keys();
    }

    async getKeys() {
        return await wpStore.keys();
    }

    keyExists(key) {//не асинхронная
        return this.cachedKeys.includes(key);
    }
}

export default new WallpaperStorage();