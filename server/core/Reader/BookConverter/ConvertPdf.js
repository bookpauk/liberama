//const _ = require('lodash');
const fs = require('fs-extra');
const path = require('path');

const sax = require('../../sax');
const utils = require('../../utils');
const ConvertHtml = require('./ConvertHtml');
const xmlParser = require('../../xmlParser');

class ConvertPdf extends ConvertHtml {
    check(data, opts) {
        const {inputFiles} = opts;

        return this.config.useExternalBookConverter && 
            inputFiles.sourceFileType && inputFiles.sourceFileType.ext == 'pdf';
    }

    async run(notUsed, opts) {
        if (!this.check(notUsed, opts))
            return false;

        await this.checkExternalConverterPresent();

        const {inputFiles, callback, abort, uploadFileName} = opts;

        const inpFile = inputFiles.sourceFile;
        const outBasename = `${inputFiles.filesDir}/${utils.randomHexString(10)}`;
        const outFile = `${outBasename}.xml`;
        const metaFile = `${outBasename}_metadata.xml`;

        const pdfaltoPath = `${this.config.dataDir}/pdfalto/pdfalto`;

        if (!await fs.pathExists(pdfaltoPath))
            throw new Error('Внешний конвертер pdfalto не найден');

        //конвертируем в xml
        let perc = 0;
        await this.execConverter(pdfaltoPath, [inpFile, outFile], () => {
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
        let fonts = {};

        let images = [];
        let loading = [];

        let title = '';
        let author = '';
        let prevTop = 0;
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

        const putPageLines = () => {
            pagelines.sort((a, b) => (a.top - b.top)*10000 + (a.left - b.left))
            
            //объединяем в одну строку равные по высоте
            const pl = [];
            let pt = -100;
            let j = -1;
            pagelines.forEach(line => {
                if (Math.abs(pt - line.top) > 3) {
                    j++;
                    pl[j] = line;
                } else {
                    pl[j].text += line.text;
                }
                pt = line.top;
            });

            //заполняем lines
            pl.forEach(line => {
                putImage(line.top);
                i++;
                lines[i] = line;
            });
            pagelines = [];
        };

        const onStartNode = (tag, tail, singleTag, cutCounter, cutTag) => {// eslint-disable-line no-unused-vars
            if (tag == 'textstyle') {
                const attrs = sax.getAttrsSync(tail);
                const fontId = (attrs.id && attrs.id.value ? attrs.id.value : '');
                const fontStyle = (attrs.fontstyle && attrs.fontstyle.value ? attrs.fontstyle.value : '');

                if (fontId && fontStyle) {
                    const styles = fontStyle.split(' ');
                    const styleTags = {bold: 'b', italics: 'i', superscript: 'sup', subscript: 'sub'};
                    const f = fonts[fontId] = {tOpen: '', tClose: ''};

                    styles.forEach(style => {
                        const s = styleTags[style];
                        if (s) {
                            f.tOpen += `<${s}>`;
                            f.tClose = `</${s}>${f.tClose}`;
                        }
                    });
                }
            }

            if (tag == 'page') {
                putPageLines();
                putImage(100000);
            }

            if (tag == 'textline') {
                const attrs = sax.getAttrsSync(tail);
                line = {
                    text: '',
                    top: parseInt((attrs.vpos && attrs.vpos.value ? attrs.vpos.value : null), 10),
                    left: parseInt((attrs.hpos && attrs.hpos.value ? attrs.hpos.value : null), 10),
                    width: parseInt((attrs.width && attrs.width.value ? attrs.width.value : null), 10),
                    height: parseInt((attrs.height && attrs.height.value ? attrs.height.value : null), 10),
                };

                if (line.width != 0 || line.height != 0) {
                    if (Math.abs(prevTop - line.top) > 3) {
                        putImage(line.top);
                        pagelines.push(line);
                    }
                    prevTop = line.top;
                }
            }

            if (tag == 'string') {
                const attrs = sax.getAttrsSync(tail);
                if (attrs.content && attrs.content.value) {

                    let tOpen = '';
                    let tClose = '';
                    const fontId = (attrs.stylerefs && attrs.stylerefs.value ? attrs.stylerefs.value : '');
                    if (fontId && fonts[fontId]) {
                        tOpen = fonts[fontId].tOpen;
                        tClose = fonts[fontId].tClose;
                    }

                    line.text += `${tOpen}${attrs.content.value}${tClose} `;
                }
            }

            if (tag == 'illustration') {
                const attrs = sax.getAttrsSync(tail);
                if (attrs.type && attrs.type.value == 'image') {
                    let src = (attrs.fileid && attrs.fileid.value ? attrs.fileid.value : '');
                    if (src) {
                        const image = {
                            isImage: true,
                            src,
                            data: '',
                            type: '',
                            top: parseInt((attrs.vpos && attrs.vpos.value ? attrs.vpos.value : null), 10) || 0,
                            left: parseInt((attrs.hpos && attrs.hpos.value ? attrs.hpos.value : null), 10) || 0,
                            width: parseInt((attrs.width && attrs.width.value ? attrs.width.value : null), 10) || 0,
                            height: parseInt((attrs.height && attrs.height.value ? attrs.height.value : null), 10) || 0,
                        };
                        const exists = images.filter(img => (img.top == image.top && img.left == image.left && img.width == image.width && img.height == image.height));
                        if (!exists.length) {
                            loading.push(loadImage(image));
                            images.push(image);
                            images.sort((a, b) => (a.top - b.top)*10000 + (a.left - b.left));
                        }
                    }
                }
            }
        };

        let buf = this.decode(data).toString();
        sax.parseSync(buf, {
            onStartNode
        });

        putPageLines();
        putImage(100000);

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

        //title
        if (fs.pathExists(metaFile)) {
            const metaXmlString = (await fs.readFile(metaFile)).toString();
            let metaXmlParsed = xmlParser.parseXml(metaXmlString);
            metaXmlParsed = xmlParser.simplifyXmlParsed(metaXmlParsed);
            if (metaXmlParsed.metadata) {
                title = (metaXmlParsed.metadata.title ? metaXmlParsed.metadata.title._t : null);
                author = (metaXmlParsed.metadata.author ? metaXmlParsed.metadata.author._t : null);
            }
        }

        if (!title && uploadFileName)
            title = uploadFileName;

        //формируем текст
        const limitSize = 2*this.config.maxUploadFileSize;
        let text = '';
        text += `<fb2-title>${title}</fb2-title>`;
        text += `<fb2-author>${author}</fb2-author>`;

        let concat = '';
        let sp = '';
        for (const line of lines) {
            if (text.length > limitSize) {
                throw new Error(`Файл для конвертирования слишком большой|FORLOG| text.length: ${text.length} > ${limitSize}`);
            }
            
            if (line.isImage) {
                text += `<fb2-image type="${line.type}" name="${line.name}">${line.data}</fb2-image>`;
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

        await utils.sleep(100);
        return await super.run(Buffer.from(text), {skipCheck: true, isText: true});
    }
}

module.exports = ConvertPdf;
