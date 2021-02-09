import localForage from 'localforage';
//import _ from 'lodash';

const wpStore = localForage.createInstance({
    name: 'wallpaperStorage'
});

class WallpaperStorage {

    async getLength() {
        return await wpStore.length();
    }

    async setData(key, data) {
        await wpStore.setItem(key, data);
    }

    async getData(key) {
        return await wpStore.getItem(key);
    }

    async removeData(key) {
        await wpStore.removeItem(key);
    }
}

export default new WallpaperStorage();