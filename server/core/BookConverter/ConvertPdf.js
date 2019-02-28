const fs = require('fs-extra');

const sax = require('./sax');
const utils = require('../utils');
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

        const outFile = `${inputFiles.fileListDir}/${utils.randomHexString(10)}.xml`;

        //конвертируем в xml
        await this.execConverter(this.pdfToHtmlPath, ['-c', '-s', '-xml', inputFiles.sourceFile, outFile]);
        callback(50);

        const data = await fs.readFile(outFile);
        callback(60);

        //парсим xml
        let lines = [];
        let inText = false;
        let title = '';
        let i = -1;

        const onTextNode = (text, cutCounter, cutTag) => {// eslint-disable-line no-unused-vars
            if (!cutCounter && inText) {
                lines[i].text += text + ' ';
                if (i < 2)
                    title += text + ' ';
            }
        };

        const onStartNode = (tag, tail, singleTag, cutCounter, cutTag) => {// eslint-disable-line no-unused-vars
            if (!cutCounter) {
                if (tag == 'text' && !inText) {
                    let attrs = sax.getAttrsSync(tail);
                    const line = {
                        text: '',
                        top: (attrs.top && attrs.top.value ? attrs.top.value : null),
                        left: (attrs.left && attrs.left.value ? attrs.left.value : null),
                        width: (attrs.width && attrs.width.value ? attrs.width.value : null),
                        height: (attrs.height && attrs.height.value ? attrs.height.value : null),
                    };

                    if (line.width !== '0' || line.height !== '0') {
                        inText = true;
                        i++;
                        lines[i] = line;
                    }
                }
            }
        };

        const onEndNode = (tag, tail, singleTag, cutCounter, cutTag) => {// eslint-disable-line no-unused-vars
            if (tag == 'text')
                inText = false;
        };

        let buf = this.decode(data).toString();
        sax.parseSync(buf, {
            onStartNode, onEndNode, onTextNode
        });

        //найдем параграфы и отступы
        const indents = [];
        for (const line of lines) {
            const top = parseInt(line.top);
            const left = parseInt(line.left);

            if (!isNaN(top)) {
                line.top = top;
            }

            if (!isNaN(left)) {
                indents[left] = 1;
                line.left = left;
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
        for (const line of lines) {
            const left = line.left || 0;
            const sp = ' '.repeat(indents[left]);

            text += sp + line.text + "\n";
        }

        return await super.run(Buffer.from(text), {skipCheck: true, isText: true, cutTitle: true});
    }
}

module.exports = ConvertPdf;
