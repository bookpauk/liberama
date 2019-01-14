import EasySAXParser from './easysax';
import {sleep} from '../../../share/utils';

export default class BookParser {
    constructor() {
        this.parser = new EasySAXParser();
    }

    async parse(data, callback) {
        if (!callback)
            callback = () => {};
        callback(0);

        this.data = data;

        if (data.indexOf('<FictionBook') < 0) {            
            throw new Error('Неверный формат файла');
        }

        let nextPerc = 0;

        /*
        firstName = book.get('//FictionBook:first-name', nameSpace).text();
        lastName = book.get('//FictionBook:last-name', nameSpace).text();
        genre = book.get('//FictionBook:genre', nameSpace).text();
        date = book.get('//FictionBook:date', nameSpace).text();
        bookTitle = book.get('//FictionBook:book-title', nameSpace).text();
        annotation = book.get('//FictionBook:annotation', nameSpace).text();
        id = book.get('//FictionBook:id', nameSpace).text();
        */
        const parser = this.parser;
        let result = {};

        parser.on('error', (msgError) => {// eslint-disable-line no-unused-vars
        });

        parser.on('startNode', (elemName, getAttr, isTagEnd, getStrNode) => {// eslint-disable-line no-unused-vars
            //console.log(elemName, ' start');
        });

        parser.on('endNode', (elemName, isTagStart, getStrNode) => {// eslint-disable-line no-unused-vars
            //console.log(elemName, ' end');
        });

        parser.on('textNode', (text) => {// eslint-disable-line no-unused-vars
            //console.log(text);
        });

        parser.on('cdata', (data) => {// eslint-disable-line no-unused-vars
        });

        parser.on('comment', (text) => {// eslint-disable-line no-unused-vars
        });

        parser.on('progress', async(progress) => {
            if (progress > nextPerc) {
                await sleep(1);
                callback(progress);
                nextPerc += 10;
            }
        });

        await parser.parse(data);
        if (callback)
            callback(100);

        return result;
    }
}