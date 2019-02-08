import he from 'he';
import sax from '../../../../server/core/BookConverter/sax';
import {sleep} from '../../../share/utils';

export default class BookParser {
    constructor() {
        // defaults
        this.p = 30;// px, отступ параграфа
        this.w = 300;// px, ширина страницы
        this.wordWrap = false;// перенос по слогам

        //заглушка
        this.measureText = (text, style) => {// eslint-disable-line no-unused-vars
            return text.length*20;
        };
    }

    async parse(data, callback) {
        if (!callback)
            callback = () => {};
        callback(0);

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
        let center = false;
        let bold = false;

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
                text: text,
            };

            para[paraIndex] = p;
            paraOffset += p.length;
        };

        const growParagraph = (text, len) => {
            if (paraIndex < 0) {
                newParagraph(text, len);
                return;
            }

            let p = para[paraIndex];
            if (p) {
                paraOffset -= p.length;
                if (p.length == 1 && p.text[0] == ' ' && len > 0) {
                    p.length = 0;
                    p.text = p.text.substr(1);
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

        const onStartNode = (elemName) => {// eslint-disable-line no-unused-vars
            if (elemName == '?xml')
                return;

            tag = elemName;
            path += '/' + elemName;

            if ((tag == 'p' || tag == 'empty-line') && path.indexOf('/fictionbook/body/section') == 0) {
                newParagraph(' ', 1);
            }

            if (tag == 'emphasis' || tag == 'strong') {
                growParagraph(`<${tag}>`, 0);
            }

            if (tag == 'title') {
                //newParagraph(' ', 1);
                bold = true;
                center = true;
            }

            if (tag == 'subtitle') {
                //newParagraph(' ', 1);
                bold = true;
            }
        };

        const onEndNode = (elemName) => {// eslint-disable-line no-unused-vars
            if (tag == elemName) {
                if (tag == 'emphasis' || tag == 'strong') {
                    growParagraph(`</${tag}>`, 0);
                }

                if (tag == 'title') {
                    bold = false;
                    center = false;
                }

                if (tag == 'subtitle')
                    bold = false;

                path = path.substr(0, path.length - tag.length - 1);
                let i = path.lastIndexOf('/');
                if (i >= 0) {
                    tag = path.substr(i + 1);
                } else {
                    tag = path;
                }
            }
        };

        const onTextNode = (text) => {// eslint-disable-line no-unused-vars
            text = he.decode(text);
            text = text.replace(/>/g, '&gt;');
            text = text.replace(/</g, '&lt;');

            if (text != ' ' && text.trim() == '')
                text = text.trim();

            if (text == '')
                return;

            text = text.replace(/[\t\n\r]/g, ' ');

            switch (path) {
                case '/fictionbook/description/title-info/author/first-name':
                    fb2.firstName = text;
                    break;
                case '/fictionbook/description/title-info/author/middle-name':
                    fb2.middleName = text;
                    break;
                case '/fictionbook/description/title-info/author/last-name':
                    fb2.lastName = text;
                    break;
                case '/fictionbook/description/title-info/genre':
                    fb2.genre = text;
                    break;
                case '/fictionbook/description/title-info/date':
                    fb2.date = text;
                    break;
                case '/fictionbook/description/title-info/book-title':
                    fb2.bookTitle = text;
                    break;
                case '/fictionbook/description/title-info/id':
                    fb2.id = text;
                    break;
            }

            if (path.indexOf('/fictionbook/description/title-info/annotation') == 0) {
                if (!fb2.annotation)
                    fb2.annotation = '';
                if (tag != 'annotation')
                    fb2.annotation += `<${tag}>${text}</${tag}>`;
                else
                    fb2.annotation += text;
            }

            let tOpen = (center ? '<center>' : '');
            tOpen += (bold ? '<strong>' : '');
            let tClose = (center ? '</center>' : '');
            tClose += (bold ? '</strong>' : '');

            if (path.indexOf('/fictionbook/body/title') == 0) {
                newParagraph(`${tOpen}${text}${tClose}`, text.length, true);
            }

            if (path.indexOf('/fictionbook/body/section') == 0) {
                switch (tag) {
                    case 'p':
                        growParagraph(`${tOpen}${text}${tClose}`, text.length);
                        break;
                    default:
                        growParagraph(`${tOpen}${text}${tClose}`, text.length);
                }
            }
        };

        const onProgress = async(prog) => {
            await sleep(1);
            callback(prog);
        };

        await sax.parse(data, {
            onStartNode, onEndNode, onTextNode, onProgress
        });

        this.fb2 = fb2;
        this.para = para;

        this.textLength = paraOffset;

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

    splitToStyle(s) {
        let result = [];/*array of {
            style: {bold: Boolean, italic: Boolean, center: Boolean},
            text: String,
        }*/
        let style = {};

        const onTextNode = async(text) => {// eslint-disable-line no-unused-vars
            result.push({
                style: Object.assign({}, style),
                text: text
            });
        };

        const onStartNode = async(elemName) => {// eslint-disable-line no-unused-vars
            switch (elemName) {
                case 'strong':
                    style.bold = true;
                    break;
                case 'emphasis':
                    style.italic = true;
                    break;
                case 'center':
                    style.center = true;
                    break;
            }
        };

        const onEndNode = async(elemName) => {// eslint-disable-line no-unused-vars
            switch (elemName) {
                case 'strong':
                    style.bold = false;
                    break;
                case 'emphasis':
                    style.italic = false;
                    break;
                case 'center':
                    style.center = false;
                    break;
            }
        };

        sax.parseSync(s, {
            onStartNode, onEndNode, onTextNode
        });


        //длинные слова (или белиберду без пробелов) тоже разобьем
        const maxWordLength = this.maxWordLength;
        const parts = result;
        result = [];
        for (const part of parts) {
            let p = part;
            let i = 0;
            let spaceIndex = -1;
            while (i < p.text.length) {
                if (p.text[i] == ' ')
                    spaceIndex = i;

                if (i - spaceIndex >= maxWordLength && i < p.text.length - 1 && 
                    this.measureText(p.text.substr(spaceIndex + 1, i - spaceIndex), p.style) >= this.w - this.p) {
                    result.push({style: p.style, text: p.text.substr(0, i + 1)});
                    p = {style: p.style, text: p.text.substr(i + 1)};
                    spaceIndex = -1;
                    i = -1;
                }
                i++;
            }
            result.push(p);
        }

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
        const alpha = new Set([...glas, ...soglas, ...znak]);

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
                    (znak.has(word[i]) && alpha.has(word[i + 1]) && alpha.has(word[i + 2])) ||
                    (word[i] == '-')
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

        if (!this.force &&
            para.parsed && 
            para.parsed.w === this.w &&
            para.parsed.p === this.p &&
            para.parsed.wordWrap === this.wordWrap &&
            para.parsed.maxWordLength === this.maxWordLength &&
            para.parsed.font === this.font
            )
            return para.parsed;

        const parsed = {
            w: this.w,
            p: this.p,
            wordWrap: this.wordWrap,
            maxWordLength: this.maxWordLength,
            font: this.font,
        };


        const lines = []; /* array of
        {
            begin: Number,
            end: Number,
            first: Boolean,
            last: Boolean,
            parts: array of {
                style: {bold: Boolean, italic: Boolean, center: Boolean},
                text: String,
            }
        }*/
        let parts = this.splitToStyle(para.text);

        let line = {begin: para.offset, parts: []};
        let partText = '';//накапливаемый кусок со стилем

        let str = '';//измеряемая строка
        let prevStr = '';//строка без крайнего слова
        let prevW = 0;
        let j = 0;//номер строки
        let style = {};
        let ofs = 0;//смещение от начала параграфа para.offset

        // тут начинается самый замес, перенос по слогам и стилизация
        for (const part of parts) {
            const words = part.text.split(' ');
            style = part.style;

            let sp1 = '';
            let sp2 = '';
            for (let i = 0; i < words.length; i++) {
                const word = words[i];
                ofs += word.length + (i < words.length - 1 ? 1 : 0);

                if (word == '' && i > 0 && i < words.length - 1)
                    continue;

                str += sp1 + word;

                let p = (j == 0 ? parsed.p : 0);
                let w = this.measureText(str, style) + p;
                let wordTail = word;
                if (w > parsed.w && prevStr != '') {
                    if (parsed.wordWrap) {//по слогам
                        let slogi = this.splitToSlogi(word);

                        if (slogi.length > 1) {
                            let s = prevStr + sp1;
                            let ss = sp1;

                            let pw;
                            const slogiLen = slogi.length;
                            for (let k = 0; k < slogiLen - 1; k++) {
                                let slog = slogi[0];
                                let ww = this.measureText(s + slog + (slog[slog.length - 1] == '-' ? '' : '-'), style) + p;
                                if (ww <= parsed.w) {
                                    s += slog;
                                    ss += slog;
                                } else 
                                    break;
                                pw = ww;
                                slogi.shift();
                            }

                            if (pw) {
                                prevW = pw;
                                partText += ss + (ss[ss.length - 1] == '-' ? '' : '-');
                                wordTail = slogi.join('');
                            }
                        }
                    }

                    if (partText != '')
                        line.parts.push({style, text: partText});

                    if (line.parts.length) {//корявенько, коррекция при переносе, отрефакторить не вышло
                        let t = line.parts[line.parts.length - 1].text;
                        if (t[t.length - 1] == ' ') {
                            line.parts[line.parts.length - 1].text = t.trimRight();
                            prevW -= this.measureText(' ', style);
                        }
                    }

                    line.end = para.offset + ofs - wordTail.length - 1 - (i < words.length - 1 ? 1 : 0);
                    if (line.end - line.begin < 0)
                        console.error(`Parse error, empty line in paragraph ${paraIndex}`);

                    line.width = prevW;
                    line.first = (j == 0);
                    line.last = false;
                    lines.push(line);

                    line = {begin: line.end + 1, parts: []};
                    partText = '';
                    sp2 = '';
                    str = wordTail;
                    j++;
                }

                prevStr = str;
                partText += sp2 + wordTail;
                sp1 = ' ';
                sp2 = ' ';
                prevW = w;
            }

            if (partText != '')
                line.parts.push({style, text: partText});
            partText = '';
        }

        if (line.parts.length) {//корявенько, коррекция при переносе
            let t = line.parts[line.parts.length - 1].text;
            if (t[t.length - 1] == ' ') {
                line.parts[line.parts.length - 1].text = t.trimRight();
                prevW -= this.measureText(' ', style);
            }

            line.end = para.offset + para.length - 1;
            if (line.end - line.begin < 0)
                console.error(`Parse error, empty line in paragraph ${paraIndex}`);

            line.width = prevW;
            line.first = (j == 0);
            line.last = true;
            lines.push(line);
        } else {//подстраховка
            if (lines.length) {
                line = lines[lines.length - 1];
                const end = para.offset + para.length - 1;
                if (line.end != end)
                    console.error(`Parse error, wrong end in paragraph ${paraIndex}`);
                line.end = end;
            }
        }

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
        let result = [];
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

        if (!result.length)
            result = null;
        return result;
    }
}