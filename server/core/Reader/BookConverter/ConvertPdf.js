//const _ = require('lodash');
const fs = require('fs-extra');
const path = require('path');

const sax = require('../../sax');
const utils = require('../../utils');
const ConvertHtml = require('./ConvertHtml');

class ConvertPdf extends ConvertHtml {
    check(data, opts) {
        const {inputFiles} = opts;

        return this.config.useExternalBookConverter && 
            inputFiles.sourceFileType && inputFiles.sourceFileType.ext == 'pdf';
    }

    async run(notUsed, opts) {
        if (!opts.pdfAsText || !this.check(notUsed, opts))
            return false;

        await this.checkExternalConverterPresent();

        const {inputFiles, callback, abort, uploadFileName} = opts;

        const inpFile = inputFiles.sourceFile;
        const outBasename = `${inputFiles.filesDir}/${utils.randomHexString(10)}`;
        const outFile = `${outBasename}.xml`;

        const pdftohtmlPath = '/usr/bin/pdftohtml';
        if (!await fs.pathExists(pdftohtmlPath))
            throw new Error('Внешний конвертер pdftohtml не найден');

        //конвертируем в xml
        let perc = 0;
        await this.execConverter(pdftohtmlPath, ['-nodrm', '-c', '-s', '-xml', inpFile, outFile], () => {
            perc = (perc < 80 ? perc + 10 : 40);
            callback(perc);
        }, abort);
        callback(80);

        const data = await fs.readFile(outFile);
        callback(90);

        await utils.sleep(100);

        //парсим xml
        let lines = [];
        let pagelines = [];
        let line = {text: ''};
        let page = {};
        let fonts = {};
        let sectionTitleFound = false;

        let images = [];
        let loading = [];

        let inText = false;
        let bold = false;
        let italic = false;

        let i = -1;

        const loadImage = async(image) => {
            const src = path.parse(image.src);
            let type = 'unknown';
            switch (src.ext) {
                case '.jpg': type = 'image/jpeg'; break;
                case '.png': type = 'image/png'; break;
            }
            if (type != 'unknown') {
                image.data = (await fs.readFile(image.src)).toString('base64');
                image.type = type;
                image.name = src.base;
            }
        };

        const putImage = (curTop) => {
            if (!isNaN(curTop) && images.length) {
                while (images.length && images[0].top < curTop) {
                    i++;
                    lines[i] = images[0];
                    images.shift();
                }
            }
        };

        const isTextBold = (text) => {
            const m = text.trim().match(/^<b>(.*)<\/b>$/);
            return m && !m[1].match(/<b>|<\/b>|<i>|<\/i>/g);
        };

        const isTextEmpty = (text) => {
            return text.replace(/<b>|<\/b>|<i>|<\/i>/g, '').trim() == '';
        };

        const putPageLines = () => {
            pagelines.sort((a, b) => (Math.abs(a.top - b.top) > 3 ? a.top - b.top : 0)*10000 + (a.left - b.left))
            
            //объединяем в одну строку равные по высоте
            const pl = [];
            let pt = 0;
            let j = -1;
            pagelines.forEach(line => {
                if (isTextEmpty(line.text))
                    return;

                //проверим, возможно это заголовок
                if (line.fontId && line.pageWidth) {
                    const centerLeft = (line.pageWidth - line.width)/2;
                    if (isTextBold(line.text) && Math.abs(centerLeft - line.left) < 10) {
                        if (!sectionTitleFound) {
                            line.isSectionTitle = true;
                            sectionTitleFound = true;
                        } else {
                            line.isSubtitle = true;
                        }
                    }
                }

                //объединяем
                if (pt == 0 || Math.abs(pt - line.top) > 3) {
                    j++;
                    pl[j] = line;
                } else {
                    pl[j].text += ` ${line.text}`;
                }
                pt = line.top;
            });

            //заполняем lines
            const lastIndex = i;
            pl.forEach(line => {
                putImage(line.top);

                //добавим пустую строку, если надо
                const prevLine = (i > lastIndex ? lines[i] : {fonts: [], top: 0});
                if (prevLine && !prevLine.isImage) {
                    const f = (prevLine.fontId ? fonts[prevLine.fontId] : (line.fontId ? fonts[line.fontId] : null));
                    if (f && f.fontSize && !line.isImage && line.top - prevLine.top > f.fontSize * 1.8) {
                        i++;
                        lines[i] = {text: '<br>'};
                    }
                }

                i++;
                lines[i] = line;
            });
            pagelines = [];
            putImage(100000);
        };

        const onTextNode = (text, cutCounter, cutTag) => {// eslint-disable-line no-unused-vars
            if (!cutCounter && inText) {
                let tOpen = (bold ? '<b>' : '');
                tOpen += (italic ? '<i>' : '');
                let tClose = (italic ? '</i>' : '');
                tClose += (bold ? '</b>' : '');

                line.text += ` ${tOpen}${text}${tClose}`;
            }
        };

        const onStartNode = (tag, tail, singleTag, cutCounter, cutTag) => {// eslint-disable-line no-unused-vars
            if (inText) {
                switch (tag) {
                    case 'i':
                        italic = true;
                        break;
                    case 'b':
                        bold = true;
                        break;
                }
            }

            if (tag == 'page') {
                const attrs = sax.getAttrsSync(tail);
                page = {
                    width: parseInt((attrs.width && attrs.width.value ? attrs.width.value : null), 10),
                };

                putPageLines();
            }

            if (tag == 'fontspec') {
                const attrs = sax.getAttrsSync(tail);
                const fontId = (attrs.id && attrs.id.value ? attrs.id.value : '');
                const fontSize = (attrs.size && attrs.size.value ? attrs.size.value : '');

                if (fontId) {
                    fonts[fontId] = {fontSize};

                }
            }

            if (tag == 'text' && !inText) {
                const attrs = sax.getAttrsSync(tail);
                line = {
                    text: '',
                    top: parseInt((attrs.top && attrs.top.value ? attrs.top.value : null), 10),
                    left: parseInt((attrs.left && attrs.left.value ? attrs.left.value : null), 10),
                    width: parseInt((attrs.width && attrs.width.value ? attrs.width.value : null), 10),
                    height: parseInt((attrs.height && attrs.height.value ? attrs.height.value : null), 10),
                    isSectionTitle: false,
                    isSubtitle: false,
                    pageWidth: page.width,
                    fontId: (attrs.font && attrs.font.value ? attrs.font.value : ''),
                };

                if (line.width != 0 || line.height != 0) {
                    inText = true;
                    pagelines.push(line);
                }
            }

            if (tag == 'image') {
                const attrs = sax.getAttrsSync(tail);
                let src = (attrs.src && attrs.src.value ? attrs.src.value : '');
                if (src) {
                    const image = {
                        isImage: true,
                        src,
                        data: '',
                        type: '',
                        top: parseInt((attrs.top && attrs.top.value ? attrs.top.value : null), 10) || 0,
                        left: parseInt((attrs.left && attrs.left.value ? attrs.left.value : null), 10) || 0,
                        width: parseInt((attrs.width && attrs.width.value ? attrs.width.value : null), 10) || 0,
                        height: parseInt((attrs.height && attrs.height.value ? attrs.height.value : null), 10) || 0,
                    };

                    loading.push(loadImage(image));
                    images.push(image);
                    images.sort((a, b) => (a.top - b.top)*10000 + (a.left - b.left));
                }
            }
        };

        const onEndNode = (tag, tail, singleTag, cutCounter, cutTag) => {// eslint-disable-line no-unused-vars
            if (inText) {
                switch (tag) {
                    case 'i':
                        italic = false;
                        break;
                    case 'b':
                        bold = false;
                        break;
                }
            }

            if (tag == 'text')
                inText = false;
        };

        let buf = this.decode(data).toString();
        sax.parseSync(buf, {
            onStartNode, onEndNode, onTextNode
        });

        putPageLines();

        await Promise.all(loading);
        await utils.sleep(100);

        //найдем параграфы и отступы
        const indents = [];
        for (const line of lines) {
            if (line.isImage)
                continue;
            if (!isNaN(line.left)) {
                indents[line.left] = 1;
            }
        }

        let j = 0;
        for (let i = 0; i < indents.length; i++) {
            if (indents[i]) {
                j++;
                indents[i] = j;
            }
        }
        indents[0] = 0;

        //author & title
        let {author, title} = await this.getPdfTitleAndAuthor(inpFile);

        if (!title && uploadFileName)
            title = uploadFileName;

        //console.log(JSON.stringify(lines, null, 2));
        //формируем текст
        const limitSize = 2*this.config.maxUploadFileSize;
        let text = '';
        if (title)
            text += `<fb2-title>${title}</fb2-title>`;
        if (author)
            text += `<fb2-author>${author}</fb2-author>`;

        let concat = '';
        let sp = '';
        let firstLine = true;
        for (const line of lines) {
            if (text.length > limitSize) {
                throw new Error(`Файл для конвертирования слишком большой|FORLOG| text.length: ${text.length} > ${limitSize}`);
            }
            
            if (line.isImage) {
                text += `<fb2-image type="${line.type}" name="${line.name}">${line.data}</fb2-image>`;
                continue;
            }

            if (line.isSectionTitle) {
                if (firstLine)
                    text += `<fb2-section-title>${line.text.trim()}</fb2-section-title>`;
                else
                    text += `<fb2-subtitle>${line.text.trim()}</fb2-subtitle>`;
                continue;
            }

            firstLine = false;

            if (line.isSubtitle) {
                text += `<br><fb2-subtitle>${line.text.trim()}</fb2-subtitle>`;
                continue;
            }

            if (concat == '') {
                const left = line.left || 0;
                sp = ' '.repeat(indents[left]);
            }

            let t = line.text.trim();
            if (t.substr(-1) == '-') {
                t = t.substr(0, t.length - 1);
                concat += t;
            } else {
                text += sp + concat + t + "\n";
                concat = '';
            }
        }
        if (concat)
            text += sp + concat + "\n";

        //console.log(text);
        await utils.sleep(100);
        return await super.run(Buffer.from(text), {skipHtmlCheck: true, isText: true});
    }

    async getPdfTitleAndAuthor(pdfFile) {
        const result = {author: '', title: ''};

        const pdfinfoPath = '/usr/bin/pdfinfo';

        if (!await fs.pathExists(pdfinfoPath))
            throw new Error('Внешний конвертер pdfinfo не найден');

        const execResult = await this.execConverter(pdfinfoPath, [pdfFile]);

        const titlePrefix = 'Title:';
        const authorPrefix = 'Author:';

        const stdout = execResult.stdout.split("\n");
        stdout.forEach(line => {
            if (line.indexOf(titlePrefix) == 0) 
                result.title = line.substring(titlePrefix.length).trim();

            if (line.indexOf(authorPrefix) == 0)
                result.author = line.substring(authorPrefix.length).trim();
        });

        return result;
    }
}


module.exports = ConvertPdf;
