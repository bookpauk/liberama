const ConvertBase = require('./ConvertBase');
const sax = require('../../sax');
const textUtils = require('./textUtils');

class ConvertHtml extends ConvertBase {
    check(data, opts) {
        const {dataType} = opts;

        //html?
        if (dataType && (dataType.ext == 'html' || dataType.ext == 'xml')) 
            return {isText: false};

        //может это чистый текст?
        if (textUtils.checkIfText(data)) {
            return {isText: true};
        }

        //из буфера обмена?
        if (data.toString().indexOf('<buffer>') == 0) {
            return {isText: false};
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

        let titleInfo = {};
        let desc = {_n: 'description', 'title-info': titleInfo};
        let pars = [];
        let body = {_n: 'body', section: {_a: []}};
        let binary = [];
        let fb2 = [desc, body, binary];

        let title = '';
        let author = '';
        let inTitle = false;
        let inAuthor = false;
        let inSubTitle = false;
        let inImage = false;
        let image = {};
        let bold = false;
        let italic = false;
        let begining = true;

        let spaceCounter = [];

        const repCrLfTab = (text) => text.replace(/[\n\r]/g, '').replace(/\t/g, '    ');

        const newParagraph = () => {
            begining = false;
            pars.push({_n: 'p', _t: ''});
        };

        const growParagraph = (text) => {
            if (!pars.length)
                newParagraph();

            const l = pars.length;
            pars[l - 1]._t += text;
            if (inSubTitle)
                pars[l - 1]._n = '';

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

        const newPara = new Set(['tr', '/table', 'hr', 'br', 'br/', 'li', 'dt', 'dd', 'p', 'title', '/title', 'ul', '/ul', 'h1', 'h2', 'h3', 'h4', 'h5', '/h1', '/h2', '/h3', '/h4', '/h5']);
        const newPara2 = new Set(['h1', 'h2', 'h3', 'h4', 'h5']);

        const onTextNode = (text, cutCounter, cutTag) => {// eslint-disable-line no-unused-vars
            text = this.escapeEntities(text);

            if (!(cutCounter || inTitle) || inSubTitle) {
                let tOpen = '';
                tOpen += (inSubTitle ? '<subtitle>' : '');
                tOpen += (bold ? '<strong>' : '');
                tOpen += (italic ? '<emphasis>' : '');
                let tClose = ''
                tClose +=  (italic ? '</emphasis>' : '');
                tClose += (bold ? '</strong>' : '');
                tClose += (inSubTitle ? '</subtitle>' : '');

                growParagraph(`${tOpen}${text}${tClose}`);
            }

            if (inTitle && !title)
                title = text;

            if (inAuthor && !author)
                author = text;

            if (inImage) {
                image._t = text;
                binary.push(image);

                pars.push({_n: 'image', _attrs: {'l:href': '#' + image._attrs.id}, _t: ''});
                newParagraph();
            }

        };

        const onStartNode = (tag, tail, singleTag, cutCounter, cutTag) => {// eslint-disable-line no-unused-vars
            if (!cutCounter) {
                if (newPara2.has(tag) && !begining)
                    newParagraph();
                if (newPara.has(tag))
                    newParagraph();

                switch (tag) {
                    case 'i':
                    case 'em':
                        italic = true;
                        break;
                    case 'b':
                    case 'strong':
                    case 'h1':
                    case 'h2':
                    case 'h3':
                        bold = true;
                        break;
                }
            }

            if (tag == 'title' || tag == 'fb2-title') {
                inTitle = true;
            }

            if (tag == 'fb2-author') {
                inAuthor = true;
            }

            if (tag == 'fb2-subtitle') {
                inSubTitle = true;
            }

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
                if (newPara2.has('/' + tag))
                    newParagraph();

                switch (tag) {
                    case 'i':
                    case 'em':
                        italic = false;
                        break;
                    case 'b':
                    case 'strong':
                    case 'h1':
                    case 'h2':
                    case 'h3':
                        bold = false;
                        break;
                }
            }

            if (tag == 'title' || tag == 'fb2-title')
                inTitle = false;

            if (tag == 'fb2-author') {
                inAuthor = false;
            }

            if (tag == 'fb2-subtitle')
                inSubTitle = false;

            if (tag == 'fb2-image')
                inImage = false;
        };

        let buf = this.decode(data).toString();

        sax.parseSync(buf, {
            onStartNode, onEndNode, onTextNode,
            innerCut: new Set(['head', 'script', 'style', 'binary', 'fb2-image', 'fb2-title', 'fb2-author'])
        });

        titleInfo['book-title'] = title;
        if (author)
            titleInfo.author = {'last-name': author};

        body.section._a[0] = pars;

        //подозрение на чистый текст, надо разбить на параграфы
        if (isText || (buf.length > 30*1024 && pars.length < buf.length/2000)) {
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
            if (d < 20 && spaceCounter.length) {
                total /= 20;
                i = spaceCounter.length - 1;
                while (i > 0 && (!spaceCounter[i] || spaceCounter[i] < total)) i--;
            }

            let parIndent = (i > 0 ? i : 0);
            if (parIndent > 2) parIndent--;

            let newPars = [];
            let curPar = {};
            const newPar = () => {
                curPar = {_n: 'p', _t: ''};
                newPars.push(curPar);
            };

            for (const par of pars) {
                if (par._n != 'p') {
                    newPars.push(par);
                    continue;
                }

                newPar();

                let j = 0;
                const lines = par._t.split('\n');
                for (let line of lines) {
                    line = repCrLfTab(line);

                    let l = 0;
                    while (l < line.length && line[l] == ' ') {
                        l++;
                    }

                    if (l >= parIndent || line == '') {
                        if (j > 0)
                            newPar();
                        j++;
                    }

                    curPar._t += line.trim() + ' ';
                }
            }

            body.section._a[0] = newPars;
        }

        //убираем лишнее, делаем валидный fb2, т.к. в рез-те разбиения на параграфы бьются теги
        bold = false;
        italic = false;
        inSubTitle = false;
        pars = body.section._a[0];
        for (let i = 0; i < pars.length; i++) {
            if (pars[i]._n != 'p')
                continue;

            pars[i]._t = this.repSpaces(pars[i]._t).trim();

            if (pars[i]._t.indexOf('<') >= 0 || bold || italic) {
                const t = pars[i]._t;
                let first = true;

                let a = [];

                const onTextNode = (text) => {
                    let tOpen = '';
                    tOpen += (inSubTitle ? '<subtitle>' : '');
                    tOpen += (bold ? '<strong>' : '');
                    tOpen += (italic ? '<emphasis>' : '');
                    let tClose = ''
                    tClose +=  (italic ? '</emphasis>' : '');
                    tClose += (bold ? '</strong>' : '');
                    tClose += (inSubTitle ? '</subtitle>' : '');

                    if (first)
                        text = text.replace(/^\s+/, ''); //trimLeft
                    a.push(`${tOpen}${text}${tClose}`);
                    first = false;
                }

                const onStartNode = (tag) => {
                    if (tag == 'strong')
                        bold = true;
                    if (tag == 'emphasis')
                        italic = true;
                    if (tag == 'subtitle')
                        inSubTitle = true;
                }

                const onEndNode = (tag) => {
                    if (tag == 'strong')
                        bold = false;
                    if (tag == 'emphasis')
                        italic = false;
                    if (tag == 'subtitle')
                        inSubTitle = false;
                }

                sax.parseSync(t, { onStartNode, onEndNode, onTextNode });

                pars[i]._t = '';
                pars[i]._a = a;
            }
        }

        return this.formatFb2(fb2);
    }

}

module.exports = ConvertHtml;
