import 'localforage';
import path from 'path';

import BookParser from './BookParser';

class BookManager {
    async addBook(book, callback) {
        let meta = {url: book.url, path: book.path};

        meta.key = path.basename(book.path);

        if (callback)
            callback(100);
        return meta;
    }

    async hasBook(meta) {
    }

    async getBook(meta) {
    }
}

export default new BookManager();