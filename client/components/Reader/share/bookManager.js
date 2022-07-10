import localForage from 'localforage';
import path from 'path-browserify';
import _ from 'lodash';

import * as utils from '../../../share/utils';
import BookParser from './BookParser';

const maxDataSize = 500*1024*1024;//compressed bytes
const maxRecentLength = 5000;

//локальный кэш метаданных книг, ограничение maxDataSize
const bmMetaStore = localForage.createInstance({
    name: 'bmMetaStore'
});

//локальный кэш самих книг, ограничение maxDataSize
const bmDataStore = localForage.createInstance({
    name: 'bmDataStore'
});

//список недавно открытых книг
const bmRecentStoreNew = localForage.createInstance({
    name: 'bmRecentStoreNew'
});

class BookManager {
    async init(settings) {
        this.loaded = false;
        this.settings = settings;

        this.eventListeners = [];
        this.books = {};

        this.recent = {};
        this.saveRecent = _.debounce(() => {
            bmRecentStoreNew.setItem('recent', this.recent);
        }, 300, {maxWait: 800});

        this.saveRecentItem = _.debounce(() => {
            bmRecentStoreNew.setItem('recent-item', this.recentItem);
            this.recentRev = (this.recentRev < maxRecentLength ? this.recentRev + 1 : 1);
            bmRecentStoreNew.setItem('rev', this.recentRev);
        }, 200, {maxWait: 300});

        //загрузка bmRecentStore
        this.recentRev = await bmRecentStoreNew.getItem('rev') || 0;
        if (this.recentRev) {
            this.recent = await bmRecentStoreNew.getItem('recent');
            if (!this.recent)
                this.recent = {};

            this.recentItem = await bmRecentStoreNew.getItem('recent-item');
            if (this.recentItem)
                this.recent[this.recentItem.key] = this.recentItem;

            //конвертируем в новые ключи
            await this.convertRecent();

            this.recentLastKey = await bmRecentStoreNew.getItem('recent-last-key');
            if (this.recentLastKey) {
                const meta = await bmMetaStore.getItem(`bmMeta-${this.recentLastKey}`);
                if (_.isObject(meta)) {
                    this.books[meta.key] = meta;
                }
            }

            await this.cleanRecentBooks();
        }

        this.recentChanged = true;

        this.loadStored();//no await
    }

    //TODO: убрать в 2025г
    async convertRecent() {
        const converted = await bmRecentStoreNew.getItem('recent-converted');

        if (converted)
            return;

        for (const key in this.recent) {
            const book = this.recent[key];
            if (!book.path) {
                continue;
            }

            const newKey = this.keyFromPath(book.path);

            if (!book.deleted && key !== newKey) {
                this.recent[newKey] = _.cloneDeep(book);
                book.deleted = 1;
            }
        }

        //console.log(converted);
        (async() => {
            await utils.sleep(3000);
            this.saveRecent();
            this.emit('recent-changed');
            await bmRecentStoreNew.setItem('recent-converted', true);
        })();
    }

    //Ленивая асинхронная загрузка bmMetaStore
    async loadStored() {
        //даем время для загрузки последней читаемой книги, чтобы не блокировать приложение
        await utils.sleep(2000);

        let len = await bmMetaStore.length();
        for (let i = len - 1; i >= 0; i--) {
            const key = await bmMetaStore.key(i);
            const keySplit = key.split('-');

            if (keySplit.length == 2 && keySplit[0] == 'bmMeta') {
                let meta = await bmMetaStore.getItem(key);

                if (_.isObject(meta)) {
                    //уже может быть распарсена книга
                    const oldBook = this.books[meta.key];
                    this.books[meta.key] = meta;

                    if (oldBook && oldBook.parsed) {
                        this.books[meta.key].parsed = oldBook.parsed;
                    }
                } else {
                    await bmMetaStore.removeItem(key);
                }
            }
        }

        await this.cleanBooks();
        this.loaded = true;
        this.emit('load-stored-finish');
    }

    async cleanBooks() {
        while (1) {// eslint-disable-line no-constant-condition
            let size = 0;
            let min = Date.now();
            let toDel = null;
            for (let key in this.books) {
                let book = this.books[key];
                const bookLength = (book.length ? book.length : 0);
                size += (book.dataCompressedLength ? book.dataCompressedLength : bookLength);

                if (book.addTime < min) {
                    toDel = book;
                    min = book.addTime;
                }
            }

            if (size > maxDataSize && toDel) {
                await this.delBook(toDel);
            } else {
                break;
            }
        }
    }

    async deflateWithProgress(data, callback) {
        const chunkSize = 512*1024;
        const deflator = new utils.pako.Deflate({level: 5});

        let chunkTotal = 1 + Math.floor(data.length/chunkSize);
        let chunkNum = 0;
        let perc = 0;
        let prevPerc = 0;

        for (var i = 0; i < data.length; i += chunkSize) {
            if ((i + chunkSize) >= data.length) {
                deflator.push(data.substring(i, i + chunkSize), true);
            } else {
                deflator.push(data.substring(i, i + chunkSize), false);
            }
            chunkNum++;

            perc = Math.round(chunkNum/chunkTotal*100);
            if (perc != prevPerc) {
                callback(perc);
                await utils.sleep(1);
                prevPerc = perc;
            }
        }

        if (deflator.err) {
            throw new Error(deflator.msg);
        }
        
        callback(100);

        return deflator.result;
    }

    async inflateWithProgress(data, callback) {
        const chunkSize = 512*1024;
        const inflator = new utils.pako.Inflate({to: 'string'});

        let chunkTotal = 1 + Math.floor(data.length/chunkSize);
        let chunkNum = 0;
        let perc = 0;
        let prevPerc = 0;

        for (var i = 0; i < data.length; i += chunkSize) {
            if ((i + chunkSize) >= data.length) {
                inflator.push(data.subarray(i, i + chunkSize), true);
            } else {
                inflator.push(data.subarray(i, i + chunkSize), false);
            }
            chunkNum++;

            perc = Math.round(chunkNum/chunkTotal*100);
            if (perc != prevPerc) {
                callback(perc);
                await utils.sleep(1);
                prevPerc = perc;
            }
        }

        if (inflator.err) {
            throw new Error(inflator.msg);
        }
        
        callback(100);

        return inflator.result;
    }

    async addBook(newBook, callback) {        
        let meta = {url: newBook.url, path: newBook.path};
        meta.key = this.keyFromPath(meta.path);
        meta.addTime = Date.now();

        const cb = (perc) => {
            const p = Math.round(30*perc/100);
            callback(p);
        };

        const cb2 = (perc) => {
            const p = Math.round(30 + 65*perc/100);
            callback(p);
        };

        const result = await this.parseBook(meta, newBook.data, cb);
        result.dataCompressed = true;

        let data = newBook.data;
        if (result.dataCompressed) {
            //data = utils.pako.deflate(data, {level: 5});
            data = await this.deflateWithProgress(data, cb2);
            result.dataCompressedLength = data.byteLength;
        }
        callback(95);

        this.books[meta.key] = result;

        await bmMetaStore.setItem(`bmMeta-${meta.key}`, this.metaOnly(result));
        await bmDataStore.setItem(`bmData-${meta.key}`, data);

        callback(100);
        return result;
    }

    async hasBookParsed(meta) {
        if (!this.books) 
            return false;
        if (!meta.path)
            return false;
        if (!meta.key)
            meta.key = this.keyFromPath(meta.path);

        let book = this.books[meta.key];

        if (!book && !this.loaded) {
            book = await bmMetaStore.getItem(`bmMeta-${meta.key}`);
            if (book)
                this.books[meta.key] = book;
        }

        return !!(book && book.parsed);
    }

    async getBook(meta, callback) {
        let result = undefined;

        if (!meta.path)
            return;

        if (!meta.key)
            meta.key = this.keyFromPath(meta.path);

        result = this.books[meta.key];

        if (!result) {
            result = await bmMetaStore.getItem(`bmMeta-${meta.key}`);
            if (result)
                this.books[meta.key] = result;
        }

        if (result && !result.parsed) {
            let data = await bmDataStore.getItem(`bmData-${meta.key}`);
            callback(5);
            await utils.sleep(10);

            let cb = (perc) => {
                const p = 5 + Math.round(15*perc/100);
                callback(p);
            };

            if (result.dataCompressed) {
                try {
                    //data = utils.pako.inflate(data, {to: 'string'});
                    data = await this.inflateWithProgress(data, cb);
                } catch (e) {
                    this.delBook(meta);
                    throw e;
                }
            }
            callback(20);

            cb = (perc) => {
                const p = 20 + Math.round(80*perc/100);
                callback(p);
            };

            result = await this.parseBook(result, data, cb);
            this.books[meta.key] = result;
        }

        return result;
    }

    async delBook(meta) {
        await bmMetaStore.removeItem(`bmMeta-${meta.key}`);
        await bmDataStore.removeItem(`bmData-${meta.key}`);

        delete this.books[meta.key];
    }

    async parseBook(meta, data, callback) {
        const parsed = new BookParser(this.settings);

        const parsedMeta = await parsed.parse(data, callback);
        const result = Object.assign({}, meta, parsedMeta, {
            length: data.length,
            textLength: parsed.textLength,
            parsed
        });

        return result;
    }

    metaOnly(book) {
        let result = Object.assign({}, book);
        delete result.parsed;
        return result;
    }

    /*keyFromUrl(url) {
        return utils.stringToHex(url);
    }*/

    keyFromPath(bookPath) {
        return path.basename(bookPath);
    }
    //-- recent --------------------------------------------------------------
    async recentSetItem(item = null, skipCheck = false) {
        const rev = await bmRecentStoreNew.getItem('rev');
        if (rev != this.recentRev && !skipCheck) {//если изменение произошло в другой вкладке барузера
            const newRecent = await bmRecentStoreNew.getItem('recent');
            Object.assign(this.recent, newRecent);
            this.recentItem = await bmRecentStoreNew.getItem('recent-item');
            this.recentRev = rev;
        }

        const prevKey = (this.recentItem ? this.recentItem.key : '');
        if (item) {
            this.recent[item.key] = item;
            this.recentItem = item;
        } else {
            this.recentItem = null;
        }

        this.saveRecentItem();

        if (!item || prevKey != item.key) {
            this.saveRecent();
        }

        this.recentChanged = true;

        if (item) {
            this.emit('recent-changed', item.key);
        } else {
            this.emit('recent-changed');
        }
    }

    async recentSetLastKey(key) {
        this.recentLastKey = key;
        await bmRecentStoreNew.setItem('recent-last-key', this.recentLastKey);
    }

    async setRecentBook(value) {
        let result = this.metaOnly(value);
        result.touchTime = Date.now();
        result.deleted = 0;

        if (this.recent[result.key]) {
            result = Object.assign({}, this.recent[result.key], result);
        }

        await this.recentSetLastKey(result.key);
        await this.recentSetItem(result);
        return result;
    }

    async getRecentBook(value) {
        return this.recent[value.key];
    }

    async delRecentBook(value) {
        const item = this.recent[value.key];
        item.deleted = 1;

        if (this.recentLastKey == value.key) {
            await this.recentSetLastKey(null);
        }

        await this.recentSetItem(item);
        this.emit('recent-deleted', value.key);
    }

    async cleanRecentBooks() {
        const sorted = this.getSortedRecent();

        let isDel = false;
        for (let i = maxRecentLength; i < sorted.length; i++) {
            delete this.recent[sorted[i].key];
            isDel = true;
        }

        this.sortedRecentCached = null;

        if (isDel)
            await this.recentSetItem();
        return isDel;
    }

    mostRecentBook() {
        if (this.recentLastKey) {
            return this.recent[this.recentLastKey];
        }
        const oldKey = this.recentLastKey;

        let max = 0;
        let result = null;
        for (const key in this.recent) {
            const book = this.recent[key];
            if (!book.deleted && book.touchTime > max) {
                max = book.touchTime;
                result = book;
            }
        }
        
        const newRecentLastKey = (result ? result.key : null);
        this.recentSetLastKey(newRecentLastKey);//no await

        if (newRecentLastKey !== oldKey)
            this.emit('recent-changed');

        return result;
    }

    getSortedRecent() {
        if (!this.recentChanged && this.sortedRecentCached) {
            return this.sortedRecentCached;
        }

        let result = Object.values(this.recent);

        result.sort((a, b) => b.touchTime - a.touchTime);

        this.sortedRecentCached = result;
        this.recentChanged = false;
        return result;
    }

    findRecentByUrlAndPath(url, bookPath) {
        if (bookPath) {
            const key = this.keyFromPath(bookPath);
            const book = this.recent[key];
            if (book && !book.deleted)
                return book;
        }

        let max = 0;
        let result = null;

        for (const key in this.recent) {
            const book = this.recent[key];
            if (!book.deleted && book.url == url && book.touchTime > max) {
                max = book.touchTime;
                result = book;
            }
        }

        return result;
    }

    findRecentBySameBookKey(sameKey) {
        let max = 0;
        let result = null;

        for (const key in this.recent) {
            const book = this.recent[key];
            if (!book.deleted && book.sameBookKey == sameKey && book.touchTime > max) {
                max = book.touchTime;
                result = book;
            }
        }

        return result;
    }

    async setRecent(value) {
        const mergedRecent = _.cloneDeep(this.recent);

        Object.assign(mergedRecent, value);

        //подстраховка от hotReload
        for (let i of Object.keys(mergedRecent)) {
            if (!mergedRecent[i].key || mergedRecent[i].key !== i)
                delete mergedRecent[i];
        }
        
        this.recent = mergedRecent;

        await this.recentSetLastKey(null);
        await this.recentSetItem(null, true);

        this.emit('set-recent');
    }

    addEventListener(listener) {
        if (this.eventListeners.indexOf(listener) < 0)
            this.eventListeners.push(listener);
    }

    removeEventListener(listener) {
        const i = this.eventListeners.indexOf(listener);
        if (i >= 0)
            this.eventListeners.splice(i, 1);
    }

    emit(eventName, value) {
        if (this.eventListeners) {
            for (const listener of this.eventListeners) {
                //console.log(eventName);
                listener(eventName, value);
            }
        }
    }

}

export default new BookManager();