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
                    inText = true;
                    i++;

                    let attrs = sax.getAttrsSync(tail);
                    lines[i] = {
                        text: '',
                        top: (attrs.top && attrs.top.value ? attrs.top.value : null),
                        left: (attrs.left && attrs.left.value ? attrs.left.value : null),
                    };
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
console.log(lines.length);
        //формируем текст
        let text = ''

        text = title + "\n" + text;
        return await super.run(Buffer.from(text), {skipCheck: true, isText: true});
    }
}

module.exports = ConvertPdf;
