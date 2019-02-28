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
        let inText = false;
        let title = '';
        let prevTop = 0;
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
                        top: parseInt((attrs.top && attrs.top.value ? attrs.top.value : null), 10),
                        left: parseInt((attrs.left && attrs.left.value ? attrs.left.value : null), 10),
                        width: parseInt((attrs.width && attrs.width.value ? attrs.width.value : null), 10),
                        height: parseInt((attrs.height && attrs.height.value ? attrs.height.value : null), 10),
                    };

                    if (line.width !== '0' || line.height !== '0') {
                        inText = true;
                        if (isNaN(line.top) || isNaN(prevTop) || (Math.abs(prevTop - line.top) > 3)) {
                            i++;
                            lines[i] = line;
                        }
                        prevTop = line.top;
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
