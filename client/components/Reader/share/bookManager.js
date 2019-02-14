import localForage from 'localforage';

import * as utils from '../../../share/utils';
import BookParser from './BookParser';

const maxDataSize = 500*1024*1024;//chars, not bytes

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
        this.settings = settings;
        this.books = {};
        this.recent = {};
        this.recentChanged = true;

        let len = await bmMetaStore.length();
        for (let i = 0; i < len; i++) {
            const key = await bmMetaStore.key(i);
            const keySplit = key.split('-');

            if (keySplit.length == 2 && keySplit[0] == 'bmMeta') {
                let meta = await bmMetaStore.getItem(key);

                this.books[meta.key] = meta;
            }
        }

        len = await bmRecentStore.length();
        for (let i = 0; i < len; i++) {
            const key = await bmRecentStore.key(i);
            let r = await bmRecentStore.getItem(key);
            this.recent[r.key] = r;
        }

        await this.cleanBooks();
    }

    async cleanBooks() {
        while (1) {// eslint-disable-line no-constant-condition
            let size = 0;
            let min = Date.now();
            let toDel = null;
            for (let key in this.books) {
                let book = this.books[key];
                size += (book.length ? book.length : 0);

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

    async addBook(newBook, callback) {
        if (!this.books) 
            await this.init();
        let meta = {url: newBook.url, path: newBook.path};
        meta.key = this.keyFromUrl(meta.url);
        meta.addTime = Date.now();

        const result = await this.parseBook(meta, newBook.data, callback);

        this.books[meta.key] = result;

        await bmMetaStore.setItem(`bmMeta-${meta.key}`, this.metaOnly(result));
        await bmDataStore.setItem(`bmData-${meta.key}`, result.data);

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

        if (result && !result.data) {
            result.data = await bmDataStore.getItem(`bmData-${meta.key}`);
            this.books[meta.key] = result;
        }

        if (result && !result.parsed) {
            result = await this.parseBook(result, result.data, callback);
            this.books[meta.key] = result;
        }

        return result;
    }

    async delBook(meta) {
        if (!this.books) 
            await this.init();

        await bmMetaStore.removeItem(`bmMeta-${meta.key}`);
        await bmDataStore.removeItem(`bmData-${meta.key}`);

        delete this.books[meta.key];
    }

    async parseBook(meta, data, callback) {
        if (!this.books) 
            await this.init();
        const parsed = new BookParser(this.settings);

        const parsedMeta = await parsed.parse(data, callback);
        const result = Object.assign({}, meta, parsedMeta, {
            length: data.length,
            textLength: parsed.textLength,
            data,
            parsed
        });

        return result;
    }

    metaOnly(book) {
        let result = Object.assign({}, book);
        delete result.data;
        delete result.parsed;
        return result;
    }

    keyFromUrl(url) {
        return utils.stringToHex(url);
    }

    async setRecentBook(value, noTouch) {
        if (!this.recent) 
            await this.init();
        const result = Object.assign({}, value);
        if (!noTouch)
            Object.assign(result, {touchTime: Date.now()});

        if (result.textLength && !result.bookPos && result.bookPosPercent)
            result.bookPos = Math.round(result.bookPosPercent*result.textLength);

        this.recent[result.key] = result;

        await bmRecentStore.setItem(result.key, result);
        await this.cleanRecentBooks();

        this.recentChanged = true;
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

        await bmRecentStore.removeItem(value.key);
        delete this.recent[value.key];
        this.recentChanged = true;
    }

    async cleanRecentBooks() {
        if (!this.recent) 
            await this.init();

        if (Object.keys(this.recent).length > 100) {
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
                await this.delRecentBook(found);
                await this.cleanRecentBooks();
            }
        }
    }

    mostRecentBook() {
        if (!this.recentChanged && this.mostRecentCached) {
            return this.mostRecentCached;
        }

        let max = 0;
        let result = null;
        for (let key in this.recent) {
            const book = this.recent[key];
            if (book.touchTime > max) {
                max = book.touchTime;
                result = book;
            }
        }
        this.mostRecentCached = result;
        this.recentChanged = false;
        return result;
    }

}

export default new BookManager();