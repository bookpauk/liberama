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
        const checkResult = this.check(data, opts);
        if (!checkResult)
            return false;

        let {isText} = checkResult;
        let titleInfo = {};
        let desc = {_n: 'description', 'title-info': titleInfo};
        let pars = [];
        let body = {_n: 'body', section: {_a: []}};
        let fb2 = [desc, body];

        let title = '';
        let inTitle = false;

        let spaceCounter = [];

        const repCrLfTab = (text) => text.replace(/[\n\r]/g, '').replace(/\t/g, '    ');

        const newParagraph = () => {
            pars.push({_n: 'p', _t: ''});
        };

        const growParagraph = (text) => {
            if (!pars.length)
                newParagraph();

            const l = pars.length;
            if (pars[l - 1]._t == '')
                text = text.trimLeft();
            pars[l - 1]._t += text;

            //посчитаем отступы у текста, чтобы выделить потом параграфы
            const lines = text.split('\n');
            for (let line of lines) {
                line = repCrLfTab(line)

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
            if (!cutCounter) {
                growParagraph(text);
            }

            if (inTitle && !title)
                title = text;
        };

        const onStartNode = (tag, tail, singleTag, cutCounter, cutTag) => {// eslint-disable-line no-unused-vars
            if (!cutCounter) {
                if (newPara.has(tag))
                    newParagraph();
            }

            if (tag == 'title')
                inTitle = true;
        };

        const onEndNode = (tag, tail, singleTag, cutCounter, cutTag) => {// eslint-disable-line no-unused-vars
            if (tag == 'title')
                inTitle = false;
        };

        let buf = this.decode(data).toString();

        sax.parseSync(buf, {
            onStartNode, onEndNode, onTextNode,
            innerCut: new Set(['head', 'script', 'style', 'binary'])
        });

        titleInfo['book-title'] = title;

        //подозрение на чистый текст, надо разбить на параграфы
        if (isText || pars.length < buf.length/2000) {
            let total = 0;
            for (let i = 0; i < spaceCounter.length; i++) {
                total += (spaceCounter[i] ? spaceCounter[i] : 0);
            }
            total /= 10;
            let i = spaceCounter.length - 1;
            while (i > 0 && (!spaceCounter[i] || spaceCounter[i] < total)) i--;

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
                if (i > 0)
                    newPar();
                i++;

                const lines = par._t.split('\n');
                for (let line of lines) {
                    line = repCrLfTab(line);

                    let l = 0;
                    while (l < line.length && line[l] == ' ') {
                        l++;
                    }

                    if (l >= parIndent)
                        newPar();
                    growPar(line.trim() + ' ');
                }
            }

            body.section._a[0] = newPars;
        } else {
            body.section._a[0] = pars;
        }

        //убираем лишнее
        for (let i = 0; i < pars.length; i++)
            pars[i]._t = this.repSpaces(pars[i]._t).trim();

        return this.formatFb2(fb2);
    }

}

module.exports = ConvertHtml;
