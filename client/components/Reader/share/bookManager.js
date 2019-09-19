import localForage from 'localforage';
import _ from 'lodash';

import * as utils from '../../../share/utils';
import BookParser from './BookParser';

const maxDataSize = 300*1024*1024;//compressed bytes

const bmMetaStore = localForage.createInstance({
    name: 'bmMetaStore'
});

const bmDataStore = localForage.createInstance({
    name: 'bmDataStore'
});

const bmRecentStore = localForage.createInstance({
    name: 'bmRecentStore'
});

class BookManager {
    async init(settings) {
        this.loaded = false;
        this.settings = settings;

        this.eventListeners = [];
        this.books = {};
        this.recent = {};

        this.recentLast = await bmRecentStore.getItem('recent-last');
        if (this.recentLast) {
            this.recent[this.recentLast.key] = this.recentLast;
            const meta = await bmMetaStore.getItem(`bmMeta-${this.recentLast.key}`);
            if (_.isObject(meta)) {
                this.books[meta.key] = meta;
            }
        }

        this.recentRev = await bmRecentStore.getItem('recent-rev') || 0;
        this.recentDiffRev = await bmRecentStore.getItem('recent-diff-rev') || 0;

        this.recentChanged = true;

        this.loadStored();//no await
    }

    //Долгая асинхронная загрузка из хранилища.
    //Хранение в отдельных записях дает относительно
    //нормальное поведение при нескольких вкладках с читалкой в браузере.
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

        let key = null;
        len = await bmRecentStore.length();
        for (let i = len - 1; i >= 0; i--) {
            key = await bmRecentStore.key(i);
            if (key) {
                let r = await bmRecentStore.getItem(key);
                if (_.isObject(r) && r.key) {
                    this.recent[r.key] = r;
                }
            } else  {
                await bmRecentStore.removeItem(key);
            }
        }

        //размножение для дебага
        /*if (key) {
            for (let i = 0; i < 1000; i++) {
                const k = this.keyFromUrl(i.toString());
                this.recent[k] = Object.assign({}, _.cloneDeep(this.recent[key]), {key: k, touchTime: Date.now() - 1000000, url: utils.randomHexString(300)});
            }
        }*/
        
        await this.cleanBooks();
        await this.cleanRecentBooks();

        this.recentChanged = true;
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
        const chunkSize = 128*1024;
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
        const chunkSize = 64*1024;
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
        meta.key = this.keyFromUrl(meta.url);
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
        if (!meta.url)
            return false;
        if (!meta.key)
            meta.key = this.keyFromUrl(meta.url);

        let book = this.books[meta.key];

        if (!book && !this.loaded) {
            book = await bmDataStore.getItem(`bmMeta-${meta.key}`);
            if (book)
                this.books[meta.key] = book;
        }

        return !!(book && book.parsed);
    }

    async getBook(meta, callback) {
        let result = undefined;
        if (!meta.key)
            meta.key = this.keyFromUrl(meta.url);

        result = this.books[meta.key];

        if (!result) {
            result = await bmDataStore.getItem(`bmMeta-${meta.key}`);
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
        delete result.data;//можно будет убрать эту строку со временем
        delete result.parsed;
        return result;
    }

    keyFromUrl(url) {
        return utils.stringToHex(url);
    }

    //-- recent --------------------------------------------------------------
    async setRecentBook(value) {
        const result = this.metaOnly(value);
        result.touchTime = Date.now();
        result.deleted = 0;

        if (this.recent[result.key] && this.recent[result.key].deleted) {
            //восстановим из небытия пользовательские данные
            if (!result.bookPos)
                result.bookPos = this.recent[result.key].bookPos;
            if (!result.bookPosSeen)
                result.bookPosSeen = this.recent[result.key].bookPosSeen;
        }

        this.recent[result.key] = result;

        await bmRecentStore.setItem(result.key, result);

        this.recentLast = result;
        await bmRecentStore.setItem('recent-last', this.recentLast);

        this.recentChanged = true;
        this.emit('recent-changed', result.key);
        return result;
    }

    async getRecentBook(value) {
        let result = this.recent[value.key];
        if (!result) {
            result = await bmRecentStore.getItem(value.key);
            if (result)
                this.recent[value.key] = result;
        }
        return result;
    }

    async delRecentBook(value) {
        this.recent[value.key].deleted = 1;
        await bmRecentStore.setItem(value.key, this.recent[value.key]);

        if (this.recentLast.key == value.key) {
            this.recentLast = null;
            await bmRecentStore.setItem('recent-last', this.recentLast);
        }
        this.emit('recent-changed', value.key);
    }

    async cleanRecentBooks() {
        const sorted = this.getSortedRecent();

        let isDel = false;
        for (let i = 1000; i < sorted.length; i++) {
            await bmRecentStore.removeItem(sorted[i].key);
            delete this.recent[sorted[i].key];
            await bmRecentStore.removeItem(sorted[i].key);
            isDel = true;
        }

        this.sortedRecentCached = null;

        if (isDel)
            this.emit('recent-changed');
        return isDel;
    }

    mostRecentBook() {
        if (this.recentLast) {
            return this.recentLast;
        }
        const oldRecentLast = this.recentLast;

        let max = 0;
        let result = null;
        for (let key in this.recent) {
            const book = this.recent[key];
            if (!book.deleted && book.touchTime > max) {
                max = book.touchTime;
                result = book;
            }
        }
        this.recentLast = result;
        bmRecentStore.setItem('recent-last', this.recentLast);//no await

        if (this.recentLast !== oldRecentLast)
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

    async setRecent(value) {
        const mergedRecent = _.cloneDeep(this.recent);

        Object.assign(mergedRecent, value);
        
        //"ленивое" обновление хранилища
        (async() => {
            for (const rec of Object.values(mergedRecent)) {
                if (rec.key) {
                    await bmRecentStore.setItem(rec.key, rec);
                    await utils.sleep(1);
                }
            }
        })();

        this.recent = mergedRecent;

        this.recentLast = null;
        await bmRecentStore.setItem('recent-last', this.recentLast);

        this.recentChanged = true;
        this.emit('set-recent');
        this.emit('recent-changed');
    }

    async setRecentRev(value) {
        await bmRecentStore.setItem('recent-rev', value);
        this.recentRev = value;
    }

    async setRecentDiffRev(value) {
        await bmRecentStore.setItem('recent-diff-rev', value);
        this.recentDiffRev = value;
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