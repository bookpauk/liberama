import he from 'he';
import sax from '../../../../server/core/sax';
import * as utils from '../../../share/utils';

const maxImageLineCount = 100;
const maxParaLength = 10000;
const maxParaTextLength = 10000;

// defaults
const defaultSettings = {
    p: 30,  //px, отступ параграфа
    w: 500, //px, ширина страницы

    font: '', //css описание шрифта
    fontSize: 20, //px, размер шрифта
    wordWrap: false, //перенос по слогам
    cutEmptyParagraphs: false, //убирать пустые параграфы
    addEmptyParagraphs: 0, //добавлять n пустых параграфов перед непустым
    maxWordLength: 500, //px, максимальная длина слова без пробелов
    lineHeight: 26, //px, высота строки
    showImages: true, //показыввать изображения
    showInlineImagesInCenter: true, //выносить изображения в центр, работает на этапе первичного парсинга (parse)
    imageHeightLines: 100, //кол-во строк, максимальная высота изображения
    imageFitWidth: true, //ширина изображения не более ширины страницы
    dualPageMode: false, //двухстраничный режим
    compactTextPerc: 0, //проценты, степень компактности текста
    testWidth: 0, //ширина тестовой строки, пересчитывается извне при изменении шрифта браузером
    isTesting: false, //тестовый режим

    //заглушка, измеритель ширины текста
    measureText: (text, style) => {// eslint-disable-line no-unused-vars
        return text.length*20;
    },
};

//for splitToSlogi()
const glas = new Set(['а', 'А', 'о', 'О', 'и', 'И', 'е', 'Е', 'ё', 'Ё', 'э', 'Э', 'ы', 'Ы', 'у', 'У', 'ю', 'Ю', 'я', 'Я']);
const soglas = new Set([
    'б', 'в', 'г', 'д', 'ж', 'з', 'й', 'к', 'л', 'м', 'н', 'п', 'р', 'с', 'т', 'ф', 'х', 'ц', 'ч', 'ш', 'щ',
    'Б', 'В', 'Г', 'Д', 'Ж', 'З', 'Й', 'К', 'Л', 'М', 'Н', 'П', 'Р', 'С', 'Т', 'Ф', 'Х', 'Ч', 'Ц', 'Ш', 'Щ'
]);
const znak = new Set(['ь', 'Ь', 'ъ', 'Ъ', 'й', 'Й']);
const alpha = new Set([...glas, ...soglas, ...znak]);

export default class BookParser {
    constructor(settings = {}) {
        this.sets = {};

        this.setSettings(defaultSettings);
        this.setSettings(settings);
    }

    setSettings(settings = {}) {
        this.sets = Object.assign({}, this.sets, settings);
        this.measureText = this.sets.measureText;
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
            bookTitle: '',
        };

        let path = '';
        let tag = '';
        let center = false;
        let bold = false;
        let italic = false;
        let space = 0;
        let inPara = false;
        let isFirstBody = true;
        let isFirstSection = true;
        let isFirstTitlePara = false;

        //изображения
        this.binary = {};
        let binaryId = '';
        let binaryType = '';
        let dimPromises = [];
        this.coverPageId = '';

        //оглавление
        this.contents = [];
        this.images = [];
        let curTitle = {paraIndex: -1, title: '', subtitles: []};
        let curSubtitle = {paraIndex: -1, title: ''};
        let inTitle = false;
        let inSubtitle = false;
        let sectionLevel = 0;
        let bodyIndex = 0;
        let imageNum = 0;

        let paraIndex = -1;
        let paraOffset = 0;
        let para = []; /*array of
            {
                index: Number,
                offset: Number, //сумма всех length до этого параграфа
                length: Number, //длина text без тегов
                text: String, //текст параграфа с вложенными тегами
                addIndex: Number, //индекс добавляемого пустого параграфа (addEmptyParagraphs)
            }
        */
        const getImageDimensions = (binaryId, binaryType, data) => {
            return new Promise ((resolve, reject) => { (async() => {
                data = data.replace(/[\n\r\s]/g, '');
                const i = new Image();
                let resolved = false;
                i.onload = () => {
                    resolved = true;
                    this.binary[binaryId] = {
                        w: i.width,
                        h: i.height,
                        type: binaryType,
                        data
                    };
                    resolve();
                };

                i.onerror = reject;

                i.src = `data:${binaryType};base64,${data}`;
                await utils.sleep(30*1000);
                if (!resolved)
                    reject('Не удалось получить размер изображения');
            })().catch(reject); });
        };

        const getExternalImageDimensions = (src) => {
            return new Promise ((resolve, reject) => { (async() => {
                const i = new Image();
                let resolved = false;
                i.onload = () => {
                    resolved = true;
                    this.binary[src] = {
                        w: i.width,
                        h: i.height,
                    };
                    resolve();
                };

                i.onerror = reject;

                i.src = src;
                await utils.sleep(30*1000);
                if (!resolved)
                    reject('Не удалось получить размер изображения');
            })().catch(reject); });
        };

        const correctCurrentPara = () => {
            //коррекция текущего параграфа
            if (paraIndex >= 0) {
                const prevParaIndex = paraIndex;
                let p = para[paraIndex];
                paraOffset -= p.length;

                //уберем пробелы с концов параграфа, минимум 1 пробел должен быть у пустого параграфа
                let newParaText = p.text.trim();
                newParaText = (newParaText.length ? newParaText : ' ');
                const ldiff = p.text.length - newParaText.length;
                if (ldiff != 0) {
                    p.text = newParaText;
                    p.length -= ldiff;
                }

                //удаление параграфов, которые содержат только разметку, такого не должно быть
                if (!p.length) {
                    delete para[paraIndex];
                    paraIndex--;
                    return;
                }

                //добавление пустых (не)видимых (addEmptyParagraphs) параграфов перед текущим непустым
                if (p.text.trim() != '') {
                    for (let i = 0; i < 2; i++) {
                        para[paraIndex] = {
                            index: paraIndex,
                            offset: paraOffset,
                            length: 1,
                            text: ' ',
                            addIndex: i + 1,
                        };
                        paraIndex++;
                        paraOffset++;
                    }

                    if (curTitle.paraIndex == prevParaIndex)
                        curTitle.paraIndex = paraIndex;
                    if (curSubtitle.paraIndex == prevParaIndex)
                        curSubtitle.paraIndex = paraIndex;
                }

                p.index = paraIndex;
                p.offset = paraOffset;
                para[paraIndex] = p;
                paraOffset += p.length;
            }
        };

        const newParagraph = (text = '', len = 0) => {
            correctCurrentPara();

            //новый параграф
            paraIndex++;
            let p = {
                index: paraIndex,
                offset: paraOffset,
                length: len,//длина текста внутри параграфа без учета длины разметки
                text: text,
                addIndex: 0,
            };

            if (inSubtitle) {
                curSubtitle.title += '<p>';
            } else if (inTitle) {
                curTitle.title += '<p>';
            }

            para[paraIndex] = p;
            paraOffset += len;
        };

        const growParagraph = (text, len, textRaw) => {
            //начальный параграф
            if (paraIndex < 0) {
                newParagraph();
                growParagraph(text, len);
                return;
            }

            //ограничение на размер куска текста в параграфе
            if (textRaw && textRaw.length > maxParaTextLength) {
                while (textRaw.length > 0) {
                    const textPart = textRaw.substring(0, maxParaTextLength);
                    textRaw = textRaw.substring(maxParaTextLength);

                    newParagraph();
                    growParagraph(textPart, textPart.length);
                }
                return;
            }

            if (inSubtitle) {
                curSubtitle.title += text;
            } else if (inTitle) {
                curTitle.title += text;
            }

            const p = para[paraIndex];

            //ограничение на размер параграфа
            if (p.length > maxParaLength) {
                newParagraph();
                growParagraph(text, len);
                return;
            }

            p.length += len;
            p.text += text;
            paraOffset += len;
        };

        const onStartNode = (elemName, tail) => {// eslint-disable-line no-unused-vars
            if (elemName == '?xml')
                return;

            tag = elemName;
            path += '/' + tag;

            if (tag == 'binary') {
                let attrs = sax.getAttrsSync(tail);
                binaryType = (attrs['content-type'] && attrs['content-type'].value ? attrs['content-type'].value : '');
                binaryType = (binaryType == 'image/jpg' || binaryType == 'application/octet-stream' ? 'image/jpeg' : binaryType);
                if (binaryType == 'image/jpeg' || binaryType == 'image/png')
                    binaryId = (attrs.id.value ? attrs.id.value : '');
            }

            if (tag == 'image') {
                let attrs = sax.getAttrsSync(tail);
                if (attrs.href && attrs.href.value) {
                    const href = attrs.href.value;
                    const alt = (attrs.alt && attrs.alt.value ? attrs.alt.value : '');
                    const {id, local} = this.imageHrefToId(href);
                    if (local) {//local
                        imageNum++;

                        if (inPara && !this.sets.showInlineImagesInCenter && !center)
                            growParagraph(`<image-inline href="${href}" num="${imageNum}"></image-inline>`, 0);
                        else
                            newParagraph(`<image href="${href}" num="${imageNum}">${' '.repeat(maxImageLineCount)}</image>`, maxImageLineCount);

                        this.images.push({paraIndex, num: imageNum, id, local, alt});

                        if (inPara && this.sets.showInlineImagesInCenter)
                            newParagraph();

                        //coverpage
                        if (path == '/fictionbook/description/title-info/coverpage/image') {
                            this.coverPageId = id;
                        }
                    } else {//external
                        imageNum++;

                        if (!this.sets.isTesting) {
                            dimPromises.push(getExternalImageDimensions(href));
                        } else {
                            dimPromises.push(this.sets.getExternalImageDimensions(this, href));
                        }
                        newParagraph(`<image href="${href}" num="${imageNum}">${' '.repeat(maxImageLineCount)}</image>`, maxImageLineCount);

                        this.images.push({paraIndex, num: imageNum, id, local, alt});
                    }
                }
            }

            if (path == '/fictionbook/description/title-info/author') {
                if (!fb2.author)
                    fb2.author = [];

                fb2.author.push({});
            }

            const isPublishSequence = (path == '/fictionbook/description/publish-info/sequence');
            if (path == '/fictionbook/description/title-info/sequence' || isPublishSequence) {
                if (!fb2.sequence)
                    fb2.sequence = [];

                if (!isPublishSequence || !fb2.sequence.length) {
                    const attrs = sax.getAttrsSync(tail);
                    const seq = {};
                    if (attrs.name && attrs.name.value) {
                        seq.name = attrs.name.value;
                    }
                    if (attrs.number && attrs.number.value) {
                        seq.number = attrs.number.value;
                    }

                    fb2.sequence.push(seq);
                }
            }

            if (path.indexOf('/fictionbook/body') == 0) {
                if (tag == 'body') {
                    if (isFirstBody && fb2.annotation) {
                        const ann = fb2.annotation.split('<p>').filter(v => v).map(v => utils.removeHtmlTags(v));
                        ann.forEach(a => {
                            newParagraph(`<emphasis><space w="1">${a}</space></emphasis>`, a.length);
                        });
                        if (ann.length)
                            newParagraph();
                    }

                    if (isFirstBody && fb2.sequence && fb2.sequence.length) {
                        const bt = utils.getBookTitle(fb2);
                        if (bt.sequence) {
                            newParagraph(bt.sequence, bt.sequence.length);
                            newParagraph();
                        }
                    }

                    if (!isFirstBody)
                        newParagraph();
                    isFirstBody = false;
                    bodyIndex++;
                }

                if (tag == 'title') {
                    newParagraph();
                    isFirstTitlePara = true;
                    bold = true;
                    center = true;

                    inTitle = true;
                    curTitle = {paraIndex, title: '', inset: sectionLevel, bodyIndex, subtitles: []};
                    this.contents.push(curTitle);
                }

                if (tag == 'section') {
                    if (!isFirstSection)
                        newParagraph();
                    isFirstSection = false;
                    sectionLevel++;
                }

                if (tag == 'emphasis' || tag == 'strong' || tag == 'sup' || tag == 'sub') {
                    growParagraph(`<${tag}>`, 0);
                }

                if ((tag == 'p' || tag == 'empty-line' || tag == 'v')) {
                    if (!(tag == 'p' && isFirstTitlePara))
                        newParagraph();
                    if (tag == 'p') {
                        inPara = true;
                        isFirstTitlePara = false;
                    }
                }

                if (tag == 'subtitle') {
                    newParagraph();
                    isFirstTitlePara = true;
                    bold = true;
                    center = true;

                    if (curTitle.paraIndex < 0) {
                        curTitle = {paraIndex, title: 'Оглавление', inset: sectionLevel, bodyIndex, subtitles: []};
                        this.contents.push(curTitle);
                    }

                    inSubtitle = true;
                    curSubtitle = {paraIndex, inset: sectionLevel, title: ''};
                    curTitle.subtitles.push(curSubtitle);
                }

                if (tag == 'epigraph' || tag == 'annotation') {
                    italic = true;
                    space += 1;
                }

                if (tag == 'poem') {
                    newParagraph();
                }

                if (tag == 'text-author') {
                    newParagraph();
                    bold = true;
                    space += 1;
                }
            }
        };

        const onEndNode = (elemName) => {// eslint-disable-line no-unused-vars
            if (tag == elemName) {
                if (tag == 'binary') {
                    binaryId = '';
                }
            
                if (path.indexOf('/fictionbook/body') == 0) {
                    if (tag == 'title') {
                        isFirstTitlePara = false;
                        bold = false;
                        center = false;
                        inTitle = false;
                    }

                    if (tag == 'section') {
                        sectionLevel--;
                    }

                    if (tag == 'emphasis' || tag == 'strong' || tag == 'sup' || tag == 'sub') {
                        growParagraph(`</${tag}>`, 0);
                    }

                    if (tag == 'p') {
                        inPara = false;
                    }

                    if (tag == 'subtitle') {
                        isFirstTitlePara = false;
                        bold = false;
                        center = false;
                        inSubtitle = false;
                    }

                    if (tag == 'epigraph' || tag == 'annotation') {
                        italic = false;
                        space -= 1;
                        newParagraph();
                    }

                    if (tag == 'stanza') {
                        newParagraph();
                    }

                    if (tag == 'text-author') {
                        bold = false;
                        space -= 1;
                    }
                }

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
            text = text.replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/[\t\n\r\xa0]/g, ' ');

            if (text && text.trim() == '')
                text = ' ';

            if (!text)
                return;

            const authorLength = (fb2.author && fb2.author.length ? fb2.author.length : 0);
            switch (path) {
                case '/fictionbook/description/title-info/author/first-name':
                    if (authorLength)
                        fb2.author[authorLength - 1].firstName = text;
                    break;
                case '/fictionbook/description/title-info/author/middle-name':
                    if (authorLength)
                        fb2.author[authorLength - 1].middleName = text;
                    break;
                case '/fictionbook/description/title-info/author/last-name':
                    if (authorLength)
                        fb2.author[authorLength - 1].lastName = text;
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

            if (binaryId) {
                if (!this.sets.isTesting) {
                    dimPromises.push(getImageDimensions(binaryId, binaryType, text));
                } else {
                    dimPromises.push(this.sets.getImageDimensions(this, binaryId, binaryType, text));
                }
            }

            if (path.indexOf('/fictionbook/body/title') == 0 ||
                path.indexOf('/fictionbook/body/section') == 0 ||
                path.indexOf('/fictionbook/body/epigraph') == 0
                ) {
                let tOpen = (center ? '<center>' : '');
                tOpen += (bold ? '<strong>' : '');
                tOpen += (italic ? '<emphasis>' : '');
                tOpen += (space ? `<space w="${space}">` : '');
                let tClose = (space ? '</space>' : '');
                tClose += (italic ? '</emphasis>' : '');
                tClose += (bold ? '</strong>' : '');
                tClose += (center ? '</center>' : '');

                if (text != ' ')
                    growParagraph(`${tOpen}${text}${tClose}`, text.length, text);
                else
                    growParagraph(' ', 1);
            }
        };

        const onProgress = async(prog) => {
            await utils.sleep(1);
            callback(prog);
        };

        await sax.parse(data, {
            onStartNode, onEndNode, onTextNode, onProgress
        });
        correctCurrentPara();

        if (dimPromises.length) {
            try {
                await Promise.all(dimPromises);
            } catch (e) {
                //
            }
        }

        this.fb2 = fb2;
        this.para = para;

        this.textLength = paraOffset;

        callback(100);
        await utils.sleep(10);

        return {fb2};
    }

    imageHrefToId(id) {
        let local = false;
        if (id[0] == '#') {
            id = id.substr(1);
            local = true;
        }
        return {id, local};
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
            style: {bold: Boolean, italic: Boolean, sup: Boolean, sub: Boolean, center: Boolean, space: Number},
            image: {local: Boolean, inline: Boolean, id: String},
            text: String,
        }*/
        let style = {};
        let image = {};

        //оптимизация по памяти
        const copyStyle = (s) => {
            const r = {};
            for (const prop in s) {
                if (s[prop])
                    r[prop] = s[prop];
            }
            return r;
        };

        const onTextNode = async(text) => {// eslint-disable-line no-unused-vars
            result.push({
                style: copyStyle(style),
                image,
                text
            });
        };

        const onStartNode = async(elemName, tail) => {// eslint-disable-line no-unused-vars
            switch (elemName) {
                case 'strong':
                    style.bold = true;
                    break;
                case 'emphasis':
                    style.italic = true;
                    break;
                case 'sup': 
                    style.sup = true;
                    break;
                case 'sub':
                    style.sub = true;
                    break;
                case 'center':
                    style.center = true;
                    break;
                case 'space': {
                    let attrs = sax.getAttrsSync(tail);
                    if (attrs.w && attrs.w.value)
                        style.space = attrs.w.value;
                    break;
                }
                case 'image': {
                    let attrs = sax.getAttrsSync(tail);
                    if (attrs.href && attrs.href.value) {
                        image = this.imageHrefToId(attrs.href.value);
                        image.inline = false;
                        image.num = (attrs.num && attrs.num.value ? attrs.num.value : 0);
                    }
                    break;
                }
                case 'image-inline': {
                    let attrs = sax.getAttrsSync(tail);
                    if (attrs.href && attrs.href.value) {
                        const img = this.imageHrefToId(attrs.href.value);
                        img.inline = true;
                        img.num = (attrs.num && attrs.num.value ? attrs.num.value : 0);
                        result.push({
                            style: copyStyle(style),
                            image: img,
                            text: ''
                        });
                    }
                    break;
                }
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
                case 'sup': 
                    style.sup = false;
                    break;
                case 'sub':
                    style.sub = false;
                    break;
                case 'center':
                    style.center = false;
                    break;
                case 'space':
                    style.space = 0;
                    break;
                case 'image':
                    image = {};
                    break;
                case 'image-inline':
                    break;
            }
        };

        sax.parseSync(s, {
            onStartNode, onEndNode, onTextNode
        });

        //длинные слова (или белиберду без пробелов) тоже разобьем
        const maxWordLength = this.sets.maxWordLength;
        const parts = result;
        result = [];
        for (const part of parts) {
            let p = part;
            if (!p.image.id) {
                let i = 0;
                let spaceIndex = -1;
                while (i < p.text.length) {
                    if (p.text[i] == ' ')
                        spaceIndex = i;

                    if (i - spaceIndex >= maxWordLength && i < p.text.length - 1 && 
                        this.measureText(p.text.substr(spaceIndex + 1, i - spaceIndex), p.style) >= this.sets.w - this.sets.p) {
                        result.push({style: p.style, image: p.image, text: p.text.substr(0, i + 1)});
                        p = {style: p.style, image: p.image, text: p.text.substr(i + 1)};
                        spaceIndex = -1;
                        i = -1;
                    }
                    i++;
                }
            }
            result.push(p);
        }

        return result;
    }

    splitToSlogi(word) {
        let result = [];

        const len = word.length;
        if (len > 3) {
            let slog = '';
            let slogLen = 0;
            word += '   ';
            for (let i = 0; i < len; i++) {
                slog += word[i];
                if (alpha.has(word[i]))
                    slogLen++;

                if (slogLen > 1 && i < len - 2 && (
                        //гласная, а следом не 2 согласные буквы
                        (glas.has(word[i]) && !( soglas.has(word[i + 1]) && soglas.has(word[i + 2]) ) &&
                            alpha.has(word[i + 1]) && alpha.has(word[i + 2])
                        ) ||
                        //предыдущая не согласная буква, текущая согласная, а следом согласная и согласная|гласная буквы
                        (alpha.has(word[i - 1]) && !soglas.has(word[i - 1]) && soglas.has(word[i]) && soglas.has(word[i + 1]) && 
                            ( glas.has(word[i + 2]) || soglas.has(word[i + 2]) ) && 
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
        } else {
            result.push(word);            
        }

        return result;
    }

    parsePara(paraIndex) {
        const para = this.para[paraIndex];
        const s = this.sets;

        //перераспарсиваем только при изменении одного из параметров
        if (!this.force &&
            para.parsed && 
            para.parsed.p === s.p &&
            para.parsed.w === s.w &&
            para.parsed.font === s.font &&
            para.parsed.fontSize === s.fontSize &&
            para.parsed.wordWrap === s.wordWrap &&
            para.parsed.cutEmptyParagraphs === s.cutEmptyParagraphs &&
            para.parsed.addEmptyParagraphs === s.addEmptyParagraphs &&
            para.parsed.maxWordLength === s.maxWordLength &&
            para.parsed.lineHeight === s.lineHeight &&
            para.parsed.showImages === s.showImages &&
            para.parsed.imageHeightLines === s.imageHeightLines &&
            para.parsed.imageFitWidth === (s.imageFitWidth || s.dualPageMode) &&
            para.parsed.compactTextPerc === s.compactTextPerc &&
            para.parsed.testWidth === s.testWidth
            )
            return para.parsed;

        const parsed = {
            p: s.p,
            w: s.w,
            font: s.font,
            fontSize: s.fontSize,
            wordWrap: s.wordWrap,
            cutEmptyParagraphs: s.cutEmptyParagraphs,
            addEmptyParagraphs: s.addEmptyParagraphs,
            maxWordLength: s.maxWordLength,
            lineHeight: s.lineHeight,
            showImages: s.showImages,
            imageHeightLines: s.imageHeightLines,
            imageFitWidth: (s.imageFitWidth || s.dualPageMode),
            compactTextPerc: s.compactTextPerc,
            testWidth: s.testWidth,
            visible: true, //вычисляется позже
        };


        const lines = []; /* array of
        {
            begin: Number,
            end: Number,
            first: Boolean,
            last: Boolean,
            parts: array of {
                style: {bold: Boolean, italic: Boolean, center: Boolean},
                image: {local: Boolean, inline: Boolean, id: String, imageLine: Number, lineCount: Number, paraIndex: Number, w: Number, h: Number},
                text: String,
            }
        }*/

        let parts = this.splitToStyle(para.text);

        //инициализация парсера
        let line = {begin: para.offset, parts: []};
        let paragraphText = '';//текст параграфа
        let partText = '';//накапливаемый кусок со стилем

        let str = '';//измеряемая строка
        let prevStr = '';//строка без крайнего слова
        let j = 0;//номер строки
        let style = {};
        let ofs = 0;//смещение от начала параграфа para.offset
        let imgW = 0;
        let imageInPara = false;
        const compactWidth = this.measureText('W', {})*parsed.compactTextPerc/100;
        // тут начинается самый замес, перенос по слогам и стилизация, а также изображения
        for (const part of parts) {
            style = part.style;
            paragraphText += part.text;

            //изображения
            if (part.image.id && !part.image.inline) {
                imageInPara = true;
                let bin = this.binary[part.image.id];
                if (!bin)
                    bin = {h: 1, w: 1};

                let lineCount = parsed.imageHeightLines;
                let c = Math.ceil(bin.h/parsed.lineHeight);

                const maxH = lineCount*parsed.lineHeight;
                let maxH2 = maxH;
                if (parsed.imageFitWidth && bin.w > parsed.w) {
                    maxH2 = bin.h*parsed.w/bin.w;
                    c = Math.ceil(maxH2/parsed.lineHeight);
                }
                lineCount = (c < lineCount ? c : lineCount);

                let imageHeight = (maxH2 < maxH ? maxH2 : maxH);
                imageHeight = (imageHeight <= bin.h ? imageHeight : bin.h);

                let imageWidth = (bin.h > imageHeight ? bin.w*imageHeight/bin.h : bin.w);

                let i = 0;
                for (; i < lineCount - 1; i++) {
                    line.end = para.offset + ofs;
                    line.first = (j == 0);
                    line.last = false;
                    line.parts.push({style, text: ' ', image: {
                        local: part.image.local,
                        inline: false, 
                        id: part.image.id,
                        imageLine: i,
                        lineCount,
                        paraIndex,
                        w: imageWidth,
                        h: imageHeight,
                        num: part.image.num
                    }});
                    lines.push(line);
                    line = {begin: line.end + 1, parts: []};
                    ofs++;
                    j++;
                }
                line.first = (j == 0);
                line.last = true;
                line.parts.push({style, text: ' ',
                    image: {local: part.image.local, inline: false, id: part.image.id,
                        imageLine: i, lineCount, paraIndex, w: imageWidth, h: imageHeight, num: part.image.num}
                });
                
                continue;
            }

            if (part.image.id && part.image.inline && parsed.showImages) {
                const bin = this.binary[part.image.id];
                if (bin) {
                    let imgH = (bin.h > parsed.fontSize ? parsed.fontSize : bin.h);
                    imgW += bin.w*imgH/bin.h;
                    line.parts.push({style, text: '',
                        image: {local: part.image.local, inline: true, id: part.image.id, num: part.image.num}});
                }
            }

            let words = part.text.split(' ');

            let sp1 = '';
            let sp2 = '';
            for (let i = 0; i < words.length; i++) {
                const word = words[i];
                ofs += word.length + (i < words.length - 1 ? 1 : 0);

                if (word == '' && i > 0 && i < words.length - 1)
                    continue;

                str += sp1 + word;

                let p = (j == 0 ? parsed.p : 0) + imgW;
                p = (style.space ? p + parsed.p*style.space : p);
                let w = this.measureText(str, style) + p;
                let wordTail = word;
                if (w > parsed.w + compactWidth && prevStr != '') {
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
                                if (ww <= parsed.w + compactWidth) {
                                    s += slog;
                                    ss += slog;
                                } else 
                                    break;
                                pw = ww;
                                slogi.shift();
                            }

                            if (pw) {
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
                        }
                    }

                    line.end = para.offset + ofs - wordTail.length - 1 - (i < words.length - 1 ? 1 : 0);
                    if (line.end - line.begin < 0)
                        console.error(`Parse error, empty line in paragraph ${paraIndex}`);

                    line.first = (j == 0);
                    line.last = false;
                    lines.push(line);

                    line = {begin: line.end + 1, parts: []};
                    partText = '';
                    sp2 = '';
                    str = wordTail;
                    imgW = 0;
                    j++;
                }

                prevStr = str;
                partText += sp2 + wordTail;
                sp1 = ' ';
                sp2 = ' ';
            }

            if (partText != '')
                line.parts.push({style, text: partText});
            partText = '';
        }

        if (line.parts.length) {//корявенько, коррекция при переносе
            let t = line.parts[line.parts.length - 1].text;
            if (t[t.length - 1] == ' ') {
                line.parts[line.parts.length - 1].text = t.trimRight();
            }

            line.end = para.offset + para.length - 1;
            if (line.end - line.begin < 0)
                console.error(`Parse error, empty line in paragraph ${paraIndex}`);

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

        //parsed.visible
        if (imageInPara) {
            parsed.visible = parsed.showImages;
        } else {
            parsed.visible = !(
                (para.addIndex > parsed.addEmptyParagraphs) ||
                (para.addIndex == 0 && parsed.cutEmptyParagraphs && paragraphText.trim() == '')
            );
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
            return null;
        
        if (n > 0) {
            let parsed = this.parsePara(paraIndex);
            let i = this.findLineIndex(bookPos, parsed.lines);
            if (i === undefined)
                return null;

            while (n > 0) {
                if (parsed.visible) {
                    result.push(parsed.lines[i]);
                    n--;
                }
                i++;

                if (i >= parsed.lines.length) {
                    paraIndex++;
                    if (paraIndex < this.para.length)
                        parsed = this.parsePara(paraIndex);
                    else
                        break;
                    i = 0;
                }
            }
        } else if (n < 0) {
            n = -n;
            let parsed = this.parsePara(paraIndex);
            let i = this.findLineIndex(bookPos, parsed.lines);
            if (i === undefined)
                return null;

            while (n > 0) {
                if (parsed.visible) {
                    result.push(parsed.lines[i]);
                    n--;
                }
                i--;

                if (i < 0) {
                    paraIndex--;
                    if (paraIndex >= 0)
                        parsed = this.parsePara(paraIndex);
                    else
                        break;
                    i = parsed.lines.length - 1;
                }
            }
        }

        if (!result.length)
            result = null;

        return result;
    }
}