import EasySAXParser from './easysax';
import {sleep} from '../../../share/utils';

export default class BookParser {
    constructor() {
        // defaults
        this.p = 30;// px, отступ параграфа
        this.w = 300;// px, ширина страницы
        this.wordWrap = false;// перенос по слогам

        // заглушка
        this.measureText = (text, style) => {// eslint-disable-line no-unused-vars
            return text.length*10;
        };
    }

    async parse(data, callback) {
        if (!callback)
            callback = () => {};
        callback(0);

        this.data = data;

        if (data.indexOf('<FictionBook') < 0) {            
            throw new Error('Неверный формат файла');
        }

        //defaults
        let fb2 = {
            firstName: '',
            middleName: '',
            lastName: '',
            bookTitle: '',
        };

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

        const parser = new EasySAXParser();

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
            if (text != ' ' && text.trim() == '')
                text = text.trim();

            if (text == '')
                return;

            switch (path) {
                case '/FictionBook/description/title-info/author/first-name':
                    fb2.firstName = text;
                    break;
                case '/FictionBook/description/title-info/author/middle-name':
                    fb2.middleName = text;
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

            if (path.indexOf('/FictionBook/body/title') == 0) {
                newParagraph(text, text.length);
            }

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

        this.fb2 = fb2;
        this.para = para;

        callback(100);
        await sleep(10);

        return {fb2};
    }

    findParaIndex(bookPos) {
        let result = undefined;
        //дихотомия
        let first = 0;
        let last = this.para.length - 1;
        while (first < last) {
            let mid = first + Math.floor((last - first)/2);
            if (bookPos <= this.para[mid].offset + this.para[mid].length - 1)
                last = mid;
            else
                first = mid + 1;
        }

        if (last >= 0) {
            const ofs = this.para[last].offset;
            if (bookPos >= ofs && bookPos < ofs + this.para[last].length)
                result = last; 
        }

        return result;
    }

    removeTags(s) {
        let result = '';

        const parser = new EasySAXParser();

        parser.on('textNode', (text) => {
            result += text;
        });

        parser.parse(`<p>${s}</p>`);

        return result;
    }

    splitToSlogi(word) {
        let result = [];

        const glas = new Set(['а', 'А', 'о', 'О', 'и', 'И', 'е', 'Е', 'ё', 'Ё', 'э', 'Э', 'ы', 'Ы', 'у', 'У', 'ю', 'Ю', 'я', 'Я']);
        const soglas = new Set([
            'б', 'в', 'г', 'д', 'ж', 'з', 'й', 'к', 'л', 'м', 'н', 'п', 'р', 'с', 'т', 'ф', 'х', 'ц', 'ч', 'ш', 'щ',
            'Б', 'В', 'Г', 'Д', 'Ж', 'З', 'Й', 'К', 'Л', 'М', 'Н', 'П', 'Р', 'С', 'Т', 'Ф', 'Х', 'Ч', 'Ц', 'Ш', 'Щ'
        ]);
        const znak = new Set(['ь', 'Ь', 'ъ', 'Ъ', 'й', 'Й']);
        const alpha = new Set([...glas, ...soglas, ...znak, ' ']);

        let slog = '';
        let slogLen = 0;
        const len = word.length;
        word += '   ';
        for (let i = 0; i < len; i++) {
            slog += word[i];
            if (alpha.has(word[i]))
                slogLen++;

            if (slogLen > 1 && i < len - 2 && (
                    //гласная, а следом не 2 согласные буквы
                    (glas.has(word[i]) && !(soglas.has(word[i + 1]) && 
                        soglas.has(word[i + 2])) && alpha.has(word[i + 1]) && alpha.has(word[i + 2])
                    ) ||
                    //предыдущая не согласная буква, текущая согласная, а следом согласная и согласная|гласная буквы
                    (alpha.has(word[i - 1]) && !soglas.has(word[i - 1]) && 
                        soglas.has(word[i]) && soglas.has(word[i + 1]) && 
                        (glas.has(word[i + 2]) || soglas.has(word[i + 2])) && 
                        alpha.has(word[i + 1]) && alpha.has(word[i + 2])
                    ) ||
                    //мягкий или твердый знак или Й
                    (znak.has(word[i]))
                ) &&
                //нельзя оставлять окончания на ь, ъ, й
                !(znak.has(word[i + 2]) && !alpha.has(word[i + 3]))

                ) {
                result.push(slog);
                slog = '';
                slogLen = 0;
            }
        }
        if (slog)
            result.push(slog);

        return result;
    }

    parsePara(paraIndex) {
        const para = this.para[paraIndex];

        if (para.parsed && 
            para.parsed.w === this.w &&
            para.parsed.p === this.p &&
            para.parsed.wordWrap === this.wordWrap &&
            para.parsed.font === this.font
            )
            return para.parsed;

        const parsed = {
            w: this.w,
            p: this.p,
            wordWrap: this.wordWrap,
            font: this.font,
        };


        const lines = []; /* array of
        {
            begin: Number,
            end: Number,
            first: Boolean,
            last: Boolean,
            parts: array of {
                style: 'bold'|'italic',
                text: String,
            }
        }*/
        
        const text = this.removeTags(para.text);

        const words = text.split(' ');
        let line = {begin: para.offset, parts: []};
        let prevPart = '';
        let part = '';
        let prevW = 0;
        let j = 0;
        // тут начинается самый замес, перенос и стилизация
        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            part += word;

            let p = (j == 0 ? parsed.p : 0);
            let w = this.measureText(part) + p;
            if (w > parsed.w) {
                let wordTail;

                if (parsed.wordWrap) {                    
                    let slogi = this.splitToSlogi(word);

                    if (slogi.length > 1) {
                        let s = prevPart + ' ';
                        let pw;

                        const slogiLen = slogi.length;
                        for (let k = 0; k < slogiLen - 1; k++) {
                            let ww = this.measureText(s + slogi[0] + '-') + p;
                            if (ww <= parsed.w) {
                                s += slogi[0];
                            } else 
                                break;
                            pw = ww;
                            slogi.shift();
                        }
                        
                        if (pw) {
                            prevW = pw;
                            prevPart = s + '-';
                            wordTail = slogi.join('');
                        } else {
                            wordTail = word;
                        }
                    } else {
                        wordTail = word;
                    }
                } else {
                    wordTail = word;
                }

                line.parts.push({style: '', text: prevPart});
                line.end = line.begin + prevPart.length;//нет -1 !!!
                line.width = prevW;
                line.first = (j == 0);
                line.last = false;
                lines.push(line);

                line = {begin: line.end + 1, parts: []};
                part = wordTail;
                j++;
            }
            prevW = w;
            prevPart = part;
            part += ' ';
        }

        line.parts.push({style: '', text: prevPart});
        line.end = line.begin + prevPart.length - 1;
        line.width = prevW;
        line.first = (j == 0);
        line.last = true;
        lines.push(line);

        parsed.lines = lines;
        para.parsed = parsed;

        return parsed;
    }

    findLineIndex(bookPos, lines) {
        let result = undefined;

        //дихотомия
        let first = 0;
        let last = lines.length - 1;
        while (first < last) {
            let mid = first + Math.floor((last - first)/2);
            if (bookPos <= lines[mid].end)
                last = mid;
            else
                first = mid + 1;
        }

        if (last >= 0) {
            if (bookPos >= lines[last].begin && bookPos <= lines[last].end)
                result = last; 
        }

        return result;
    }

    getLines(bookPos, n) {
        const result = [];
        let paraIndex = this.findParaIndex(bookPos);

        if (paraIndex === undefined)
            return result;
        
        if (n > 0) {
            let parsed = this.parsePara(paraIndex);
            let i = this.findLineIndex(bookPos, parsed.lines);
            if (i === undefined)
                return result;

            while (n > 0) {
                result.push(parsed.lines[i]);
                i++;

                if (i >= parsed.lines.length) {
                    paraIndex++;
                    if (paraIndex < this.para.length)
                        parsed = this.parsePara(paraIndex);
                    else
                        return result;
                    i = 0;
                }

                n--;
            }
        } else if (n < 0) {
            n = -n;
            let parsed = this.parsePara(paraIndex);
            let i = this.findLineIndex(bookPos, parsed.lines);
            if (i === undefined)
                return result;

            while (n > 0) {
                result.push(parsed.lines[i]);
                i--;

                if (i < 0) {
                    paraIndex--;
                    if (paraIndex >= 0)
                        parsed = this.parsePara(paraIndex);
                    else
                        return result;
                    i = parsed.lines.length - 1;
                }
                
                n--;
            }
        }

        return result;
    }
}