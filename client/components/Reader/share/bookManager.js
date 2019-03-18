import localForage from 'localforage';

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

const bmCacheStore = localForage.createInstance({
    name: 'bmCacheStore'
});

class BookManager {
    async init(settings) {
        this.settings = settings;

        //bmCacheStore нужен только для ускорения загрузки читалки
        this.booksCached = await bmCacheStore.getItem('books');
        if (!this.booksCached)
            this.booksCached = {};
        this.recent = await bmCacheStore.getItem('recent');
        this.recentLast = await bmCacheStore.getItem('recent-last');
        if (this.recentLast)
            this.recent[this.recentLast.key] = this.recentLast;

        this.books = Object.assign({}, this.booksCached);

        this.recentChanged1 = true;
        this.recentChanged2 = true;

        if (!this.books || !this.recent) {
            this.books = {};
            this.recent = {};
            await this.loadMeta(true);
        } else {
            this.loadMeta(false);
        }
    }

    //долгая загрузка из хранилища,
    //хранение в отдельных записях дает относительно
    //нормальное поведение при нескольких вкладках с читалкой в браузере
    async loadMeta(immediate) {
        if (!immediate)
            await utils.sleep(2000);

        let len = await bmMetaStore.length();
        for (let i = 0; i < len; i++) {
            const key = await bmMetaStore.key(i);
            const keySplit = key.split('-');

            if (keySplit.length == 2 && keySplit[0] == 'bmMeta') {
                let meta = await bmMetaStore.getItem(key);

                const oldBook = this.books[meta.key];
                this.books[meta.key] = meta;

                if (oldBook && oldBook.parsed) {
                    this.books[meta.key].parsed = oldBook.parsed;
                }
            }
        }

        len = await bmRecentStore.length();
        for (let i = 0; i < len; i++) {
            const key = await bmRecentStore.key(i);
            let r = await bmRecentStore.getItem(key);
            this.recent[r.key] = r;
        }

        await this.cleanBooks();
        await this.cleanRecentBooks();

        this.booksCached = {};
        for (const key in this.books) {
            this.booksCached[key] = this.metaOnly(this.books[key]);
        }
        await bmCacheStore.setItem('books', this.booksCached);
        await bmCacheStore.setItem('recent', this.recent);
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
                await this._delBook(toDel);
            } else {
                break;
            }
        }
    }

    async addBook(newBook, callback) {
        if (!this.books) 
            await this.init();
        let meta = {url: newBook.url, path: newBook.path};
        meta.key = this.keyFromUrl(meta.url);
        meta.addTime = Date.now();

        const cb = (perc) => {
            const p = Math.round(80*perc/100);
            callback(p);
        };

        const result = await this.parseBook(meta, newBook.data, cb);
        result.dataCompressed = true;

        let data = newBook.data;
        if (result.dataCompressed) {
            data = utils.pako.deflate(data, {level: 9});
            result.dataCompressedLength = data.byteLength;
        }
        callback(90);

        this.books[meta.key] = result;
        this.booksCached[meta.key] = this.metaOnly(result);

        await bmMetaStore.setItem(`bmMeta-${meta.key}`, this.metaOnly(result));
        await bmDataStore.setItem(`bmData-${meta.key}`, data);
        await bmCacheStore.setItem('books', this.booksCached);

        callback(100);
        return result;
    }

    hasBookParsed(meta) {
        if (!this.books) 
            return false;
        if (!meta.url)
            return false;
        if (!meta.key)
            meta.key = this.keyFromUrl(meta.url);
        let book = this.books[meta.key];
        return !!(book && book.parsed);
    }

    async getBook(meta, callback) {
        if (!this.books) 
            await this.init();
        let result = undefined;
        if (!meta.key)
            meta.key = this.keyFromUrl(meta.url);

        result = this.books[meta.key];

        if (result && !result.parsed) {
            let data = await bmDataStore.getItem(`bmData-${meta.key}`);
            callback(10);
            await utils.sleep(10);

            if (result.dataCompressed) {
                data = utils.pako.inflate(data, {to: 'string'});
            }
            callback(20);

            const cb = (perc) => {
                const p = 20 + Math.round(80*perc/100);
                callback(p);
            };

            result = await this.parseBook(result, data, cb);
            this.books[meta.key] = result;
        }

        return result;
    }

    async _delBook(meta) {
        await bmMetaStore.removeItem(`bmMeta-${meta.key}`);
        await bmDataStore.removeItem(`bmData-${meta.key}`);

        delete this.books[meta.key];
        delete this.booksCached[meta.key];
    }

    async delBook(meta) {
        if (!this.books) 
            await this.init();

        await this._delBook(meta);

        await bmCacheStore.setItem('books', this.booksCached);
    }

    async parseBook(meta, data, callback) {
        if (!this.books) 
            await this.init();

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

    async setRecentBook(value) {
        if (!this.recent) 
            await this.init();
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

        //кэшируем, аккуратно
        if (!(this.recentLast && this.recentLast.key == result.key)) {
            await bmCacheStore.setItem('recent', this.recent);
        }
        this.recentLast = result;
        await bmCacheStore.setItem('recent-last', this.recentLast);

        this.recentChanged1 = true;
        this.recentChanged2 = true;
        return result;
    }

    async getRecentBook(value) {
        if (!this.recent) 
            await this.init();
        return this.recent[value.key];
    }

    async delRecentBook(value) {
        if (!this.recent) 
            await this.init();

        this.recent[value.key].deleted = 1;
        await bmRecentStore.setItem(value.key, this.recent[value.key].deleted);
        await bmCacheStore.setItem('recent', this.recent);

        this.recentChanged1 = true;
        this.recentChanged2 = true;
    }

    async cleanRecentBooks() {
        if (!this.recent) 
            await this.init();

        if (Object.keys(this.recent).length > 1000) {
            let min = Date.now();
            let found = null;
            for (let key in this.recent) {
                const book = this.recent[key];
                if (book.touchTime < min) {
                    min = book.touchTime;
                    found = book;
                }
            }

            if (found) {
                await bmRecentStore.removeItem(found.key);
                delete this.recent[found.key];

                await this.cleanRecentBooks();
            }
        }
    }

    mostRecentBook() {
        if (!this.recentChanged1 && this.mostRecentCached) {
            return this.mostRecentCached;
        }

        let max = 0;
        let result = null;
        for (let key in this.recent) {
            const book = this.recent[key];
            if (!book.deleted && book.touchTime > max) {
                max = book.touchTime;
                result = book;
            }
        }
        this.mostRecentCached = result;
        this.recentChanged1 = false;
        return result;
    }

    getSortedRecent() {
        if (!this.recentChanged2 && this.sortedRecentCached) {
            return this.sortedRecentCached;
        }

        let result = Object.values(this.recent);

        result.sort((a, b) => b.touchTime - a.touchTime);

        this.sortedRecentCached = result;
        this.recentChanged2 = false;
        return result;
    }

}

export default new BookManager();