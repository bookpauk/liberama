import localForage from 'localforage';
import path from 'path';

import BookParser from './BookParser';

class BookManager {
    async init() {
        this.books = {};

        const len = await localForage.length();
        for (let i = 0; i < len; i++){
            const key = await localForage.key(i);
            const keySplit = key.split('-');
            if (keySplit.length == 2 && keySplit[1] == 'meta') {
                let meta = await localForage.getItem(key);
                meta.data = await localForage.getItem(keySplit[0]);

                this.books[meta.key] = meta;
                this.books[meta.url] = meta;
            }
        }

        console.log(this.books);
    }

    async addBook(newBook, callback) {
        if (!this.books) 
            await this.init();
        let meta = {url: newBook.url, path: newBook.path};
        meta.key = path.basename(newBook.path);

        const result = await this.parseBook(meta, newBook.data, callback);

        await localForage.setItem(meta.key, result.data);
        await localForage.setItem(`${meta.key}-meta`, meta);

        return result;
    }

    async getBook(meta, callback) {
        if (!this.books) 
            await this.init();
        let result = undefined;
        if (meta.key)
            result = this.books[meta.key];
        else
            result = this.books[meta.url];

        if (result && !result.parsed) {
            result = await this.parseBook(result, result.data, callback);
        }

        return result;
    }

    async delBook(meta) {
        if (!this.books) 
            await this.init();
        let book = undefined;
        if (meta.key)
            book = this.books[meta.key];
        else
            book = this.books[meta.url];

        if (book) {
            await localForage.removeItem(book.key);
            await localForage.removeItem(`${book.key}-meta`);

            delete this.books[book.key];
            delete this.books[book.url];
        }
    }

    async parseBook(meta, data, callback) {
        if (!this.books) 
            await this.init();
        const parsed = new BookParser();

        const parsedMeta = await parsed.parse(data, callback);
        const result = Object.assign({}, meta, parsedMeta, {data, parsed});

        this.books[meta.key] = result;
        this.books[meta.url] = result;

        return result;
    }

    metaOnly(book) {
        let result = Object.assign({}, book);
        delete result.data;
        delete result.parsed;
        return result;
    }
}

export default new BookManager();