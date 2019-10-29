const fs = require('fs-extra');
const path = require('path');

const sax = require('./sax');
const utils = require('../../utils');
const ConvertHtml = require('./ConvertHtml');

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

        const {inputFiles, callback} = opts;

        const outFile = `${inputFiles.filesDir}/${utils.randomHexString(10)}.xml`;

        //конвертируем в xml
        let perc = 0;
        await this.execConverter(this.pdfToHtmlPath, ['-c', '-s', '-xml', inputFiles.sourceFile, outFile], () => {
            perc = (perc < 80 ? perc + 10 : 40);
            callback(perc);
        });
        callback(80);

        const data = await fs.readFile(outFile);
        callback(90);

        //парсим xml
        let lines = [];
        let images = [];
        let loading = [];
        let inText = false;
        let bold = false;
        let italic = false;
        let title = '';
        let prevTop = 0;
        let i = -1;
        let titleCount = 0;

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
        }

        const putImage = (curTop) => {
            if (!isNaN(curTop) && images.length) {
                while (images.length && images[0].top < curTop) {
                    i++;
                    lines[i] = images[0];
                    images.shift();
                }
            }
        }

        const onTextNode = (text, cutCounter, cutTag) => {// eslint-disable-line no-unused-vars
            if (!cutCounter && inText) {
                let tOpen = (bold ? '<b>' : '');
                tOpen += (italic ? '<i>' : '');
                let tClose = (italic ? '</i>' : '');
                tClose += (bold ? '</b>' : '');

                lines[i].text += `${tOpen}${text}${tClose} `;
                if (titleCount < 2 && text.trim() != '') {
                    title += text + (titleCount ? '' : ' - ');
                    titleCount++;
                }
            }
        };

        const onStartNode = (tag, tail, singleTag, cutCounter, cutTag) => {// eslint-disable-line no-unused-vars
            if (!cutCounter) {
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

                if (tag == 'text' && !inText) {
                    let attrs = sax.getAttrsSync(tail);
                    const line = {
                        text: '',
                        top: parseInt((attrs.top && attrs.top.value ? attrs.top.value : null), 10),
                        left: parseInt((attrs.left && attrs.left.value ? attrs.left.value : null), 10),
                        width: parseInt((attrs.width && attrs.width.value ? attrs.width.value : null), 10),
                        height: parseInt((attrs.height && attrs.height.value ? attrs.height.value : null), 10),
                    };

                    if (line.width != 0 || line.height != 0) {
                        inText = true;
                        if (isNaN(line.top) || isNaN(prevTop) || (Math.abs(prevTop - line.top) > 3)) {
                            putImage(line.top);
                            i++;
                            lines[i] = line;
                        }
                        prevTop = line.top;
                    }
                }

                if (tag == 'image') {
                    const attrs = sax.getAttrsSync(tail);
                    const src = (attrs.src && attrs.src.value ? attrs.src.value : '');
                    if (src) {
                        const image = {
                            isImage: true,
                            src,
                            data: '',
                            type: '',
                            top: parseInt((attrs.top && attrs.top.value ? attrs.top.value : null), 10) || 0,
                        };
                        loading.push(loadImage(image));
                        images.push(image);
                        images.sort((a, b) => a.top - b.top)
                    }
                }

                if (tag == 'page') {
                    putImage(100000);
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

        putImage(100000);

        await Promise.all(loading);

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

        //формируем текст
        let text = `<title>${title}</title>`;
        let concat = '';
        let sp = '';
        for (const line of lines) {
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

        return await super.run(Buffer.from(text), {skipCheck: true, isText: true, cutTitle: true});
    }
}

module.exports = ConvertPdf;
