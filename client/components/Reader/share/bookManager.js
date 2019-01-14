import localForage from 'localforage';

import * as utils from '../../../share/utils';
import BookParser from './BookParser';

const maxDataSize = 100*1024*1024;//chars, not bytes

class BookManager {
    async init() {
        this.books = {};

        const len = await localForage.length();
        for (let i = 0; i < len; i++) {
            const key = await localForage.key(i);
            const keySplit = key.split('-');

            if (keySplit.length == 2 && keySplit[0] == 'bmMeta') {
                let meta = await localForage.getItem(key);

                this.books[meta.key] = meta;
            }
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
                size += book.data.length;

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

        await localForage.setItem(`bmMeta-${meta.key}`, this.metaOnly(result));
        await localForage.setItem(`bmData-${meta.key}`, result.data);

        return result;
    }

    async getBook(meta, callback) {
        if (!this.books) 
            await this.init();
        let result = undefined;
        if (!meta.key)
            meta.key = this.keyFromUrl(meta.url);
        result = this.books[meta.key];

        if (result && !result.data) {
            result.data = await localForage.getItem(`bmData-${meta.key}`);
        }

        if (result && !result.parsed) {
            result = await this.parseBook(result, result.data, callback);
        }

        return result;
    }

    async delBook(meta) {
        if (!this.books) 
            await this.init();

        await localForage.removeItem(`bmMeta-${meta.key}`);
        await localForage.removeItem(`bmData-${meta.key}`);

        delete this.books[meta.key];
    }

    async parseBook(meta, data, callback) {
        if (!this.books) 
            await this.init();
        const parsed = new BookParser();

        const parsedMeta = await parsed.parse(data, callback);
        const result = Object.assign({}, meta, parsedMeta, {data, parsed});

        this.books[meta.key] = result;

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

}

export default new BookManager();