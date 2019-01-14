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

        let path = '';
        let tag = '';
        let nextPerc = 0;

        let paraIndex = -1;
        let paraOffset = 0;
        let para = []; /*array of
            {
                index: Number,
                offset: Number, //сумма всех length до этого параграфа
                length: Number, //длина text без тегов
                text: String //текст параграфа (или title или epigraph и т.д) с вложенными тегами
            }
        */
        const newParagraph = (text, len) => {
            paraIndex++;
            let p = {
                index: paraIndex,
                offset: paraOffset,
                length: len,
                text: text
            };

            para[paraIndex] = p;
            paraOffset += p.length;
        };
        const growParagraph = (text, len) => {
            let p = para[paraIndex];
            if (p) {
                paraOffset -= p.length;
                if (p.text == ' ') {
                    p.length = 0;
                    p.text = '';
                }
                p.length += len;
                p.text += text;
            } else {
                p = {
                    index: paraIndex,
                    offset: paraOffset,
                    length: len,
                    text: text
                };
            }

            para[paraIndex] = p;
            paraOffset += p.length;
        };

        let fb2 = {};

        const parser = this.parser;

        parser.on('error', (msgError) => {// eslint-disable-line no-unused-vars
        });

        parser.on('startNode', (elemName, getAttr, isTagEnd, getStrNode) => {// eslint-disable-line no-unused-vars
            tag = elemName;
            path += '/' + elemName;

            if ((tag == 'p' || tag == 'empty-line') && path.indexOf('/FictionBook/body/section') == 0) {
                newParagraph(' ', 1);
            }
        });

        parser.on('endNode', (elemName, isTagStart, getStrNode) => {// eslint-disable-line no-unused-vars
            if (tag == elemName) {
                path = path.substr(0, path.length - tag.length - 1);
                let i = path.lastIndexOf('/');
                if (i >= 0) {
                    tag = path.substr(i + 1);
                } else {
                    tag = path;
                }
            }
        });

        parser.on('textNode', (text) => {
            text = text.trim();

            switch (path) {
                case '/FictionBook/description/title-info/author/first-name':
                    fb2.firstName = text;
                    break;
                case '/FictionBook/description/title-info/author/last-name':
                    fb2.lastName = text;
                    break;
                case '/FictionBook/description/title-info/genre':
                    fb2.genre = text;
                    break;
                case '/FictionBook/description/title-info/date':
                    fb2.date = text;
                    break;
                case '/FictionBook/description/title-info/book-title':
                    fb2.bookTitle = text;
                    break;
                case '/FictionBook/description/title-info/id':
                    fb2.id = text;
                    break;
            }

            if (path.indexOf('/FictionBook/description/title-info/annotation') == 0) {
                if (!fb2.annotation)
                    fb2.annotation = '';
                if (tag != 'annotation')
                    fb2.annotation += `<${tag}>${text}</${tag}>`;
                else
                    fb2.annotation += text;
            }

            if (text == '')
                return;

            if (path.indexOf('/FictionBook/body/title') == 0) {
                newParagraph(text, text.length);
            }

            if (text == '')
                return;

            if (path.indexOf('/FictionBook/body/section') == 0) {
                switch (tag) {
                    case 'p':
                        growParagraph(text, text.length);
                        break;
                    case 'section':
                    case 'title':
                        newParagraph(text, text.length);
                        break;
                    default:
                        growParagraph(`<${tag}>${text}</${tag}>`, text.length);
                }
            }
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

        this.meta = fb2;
        this.para = para;

        callback(100);
        return {fb2};
    }
}