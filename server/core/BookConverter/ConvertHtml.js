const ConvertBase = require('./ConvertBase');
const sax = require('./sax');
const textUtils = require('./textUtils');

class ConvertHtml extends ConvertBase {
    check(data, opts) {
        const {dataType} = opts;

        if (dataType && (dataType.ext == 'html' || dataType.ext == 'xml')) 
            return {isText: false};

        //может это чистый текст?
        if (textUtils.checkIfText(data)) {
            return {isText: true};
        }

        return false;
    }

    async run(data, opts) {
        let isText = false;
        if (!opts.skipCheck) {
            const checkResult = this.check(data, opts);
            if (!checkResult)
                return false;

            isText = checkResult.isText;
        } else {
            isText = opts.isText;
        }
        const {cutTitle} = opts;

        let titleInfo = {};
        let desc = {_n: 'description', 'title-info': titleInfo};
        let pars = [];
        let body = {_n: 'body', section: {_a: []}};
        let binary = [];
        let fb2 = [desc, body, binary];

        let title = '';
        let inTitle = false;
        let inImage = false;
        let image = {};

        let spaceCounter = [];

        const repCrLfTab = (text) => text.replace(/[\n\r]/g, '').replace(/\t/g, '    ');

        const newParagraph = () => {
            pars.push({_n: 'p', _t: ''});
        };

        const growParagraph = (text) => {
            if (!pars.length)
                newParagraph();

            const l = pars.length;
            pars[l - 1]._t += text;

            //посчитаем отступы у текста, чтобы выделить потом параграфы
            const lines = text.split('\n');
            for (let line of lines) {
                if (line.trim() == '')
                    continue;
                line = repCrLfTab(line);

                let l = 0;
                while (l < line.length && line[l] == ' ') {
                    l++;
                }
                if (!spaceCounter[l])
                    spaceCounter[l] = 0;
                spaceCounter[l]++;
            }
        };

        const newPara = new Set(['tr', 'br', 'br/', 'dd', 'p', 'title', '/title', 'h1', 'h2', 'h3', '/h1', '/h2', '/h3']);

        const onTextNode = (text, cutCounter, cutTag) => {// eslint-disable-line no-unused-vars
            if (!cutCounter && !(cutTitle && inTitle)) {
                growParagraph(text);
            }

            if (inTitle && !title)
                title = text;

            if (inImage) {
                image._t = text;
                binary.push(image);

                pars.push({_n: 'image', _attrs: {'l:href': '#' + image._attrs.id}, _t: ''});
                newParagraph();
            }

        };

        const onStartNode = (tag, tail, singleTag, cutCounter, cutTag) => {// eslint-disable-line no-unused-vars
            if (!cutCounter) {
                if (newPara.has(tag))
                    newParagraph();
            }

            if (tag == 'title')
                inTitle = true;

            if (tag == 'fb2-image') {
                inImage = true;
                const attrs = sax.getAttrsSync(tail);
                image = {_n: 'binary', _attrs: {id: attrs.name.value, 'content-type': attrs.type.value}, _t: ''};
            }
        };

        const onEndNode = (tag, tail, singleTag, cutCounter, cutTag) => {// eslint-disable-line no-unused-vars
            if (!cutCounter) {
                if (newPara.has('/' + tag))
                    newParagraph();
            }

            if (tag == 'title')
                inTitle = false;

            if (tag == 'fb2-image')
                inImage = false;
        };

        let buf = this.decode(data).toString();

        sax.parseSync(buf, {
            onStartNode, onEndNode, onTextNode,
            innerCut: new Set(['head', 'script', 'style', 'binary', 'fb2-image'])
        });

        titleInfo['book-title'] = title;

        //подозрение на чистый текст, надо разбить на параграфы
        if (isText || pars.length < buf.length/2000) {
            let total = 0;
            let count = 1;
            for (let i = 0; i < spaceCounter.length; i++) {
                const sc = (spaceCounter[i] ? spaceCounter[i] : 0);
                if (sc) count++;
                total += sc;
            }

            let d = 0;
            const mid = total/count;
            for (let i = 0; i < spaceCounter.length; i++) {
                const sc = (spaceCounter[i] ? spaceCounter[i] : 0);
                if (sc > mid) d++;
            }

            let i = 0;
            //если разброс не слишком большой, выделяем параграфы
            if (d < 10 && spaceCounter.length) {
                total /= 20;
                i = spaceCounter.length - 1;
                while (i > 0 && (!spaceCounter[i] || spaceCounter[i] < total)) i--;
            }

            const parIndent = (i > 0 ? i : 0);

            let newPars = [];
            const newPar = () => {
                newPars.push({_n: 'p', _t: ''});
            };

            const growPar = (text) => {
                if (!newPars.length)
                    newPar();

                const l = newPars.length;
                newPars[l - 1]._t += text;
            }

            i = 0;
            for (const par of pars) {
                if (par._n != 'p') {
                    newPars.push(par);
                    continue;
                }

                if (i > 0)
                    newPar();
                i++;

                let j = 0;
                const lines = par._t.split('\n');
                for (let line of lines) {
                    line = repCrLfTab(line);

                    let l = 0;
                    while (l < line.length && line[l] == ' ') {
                        l++;
                    }

                    if (l >= parIndent) {
                        if (j > 0)
                            newPar();
                        j++;
                    }
                    growPar(line.trim() + ' ');
                }
            }

            body.section._a[0] = newPars;
        } else {
            body.section._a[0] = pars;
        }

        //убираем лишнее
        pars = body.section._a[0];
        for (let i = 0; i < pars.length; i++)
            pars[i]._t = this.repSpaces(pars[i]._t).trim();

        return this.formatFb2(fb2);
    }

}

module.exports = ConvertHtml;
