const fs = require('fs-extra');
const URL = require('url').URL;
const iconv = require('iconv-lite');
const chardet = require('chardet');
const _ = require('lodash');
const sax = require('./sax');
const textUtils = require('./textUtils');

const FileDetector = require('../FileDetector');

const repSpaces = (text) => text.replace(/&nbsp;|[\t\n\r]/g, ' ');

class BookConverter {
    constructor() {
        this.detector = new FileDetector();
    }

    async convertToFb2(inputFile, outputFile, url, callback) {
        const fileType = await this.detector.detectFile(inputFile);
        
        const data = await fs.readFile(inputFile);
        callback(100);

        if (fileType && (fileType.ext == 'html' || fileType.ext == 'xml')) {
            if (data.toString().indexOf('<FictionBook') >= 0) {
                await fs.writeFile(outputFile, this.checkEncoding(data));
                return;
            }

            const parsedUrl = new URL(url);
            if (parsedUrl.hostname == 'samlib.ru' ||
                parsedUrl.hostname == 'budclub.ru' ||
                parsedUrl.hostname == 'zhurnal.lib.ru') {
                await fs.writeFile(outputFile, this.convertSamlib(data));
                return;
            }

            await fs.writeFile(outputFile, this.convertHtml(data));
            return;
        } else {
            if (fileType)
                throw new Error(`Этот формат файла не поддерживается: ${fileType.mime}`);
            else {
                //может это чистый текст?
                if (textUtils.checkIfText(data)) {
                    await fs.writeFile(outputFile, this.convertHtml(data));
                    return;
                }

                throw new Error(`Не удалось определить формат файла: ${url}`);
            }
        }
    }

    decode(data) {
        const charsetAll = chardet.detectAll(data.slice(0, 20000));

        let selected = 'ISO-8859-5';
        for (const charset of charsetAll) {
            if (charset.name.indexOf('ISO-8859') < 0) {
                selected = charset.name;
                break;
            }
        }

        if (selected == 'ISO-8859-5') {
            selected = textUtils.getEncoding(data);
        }

        return iconv.decode(data, selected);
    }

    checkEncoding(data) {
        let result = data;

        const left = data.indexOf('<?xml version="1.0"');
        if (left >= 0) {
            const right = data.indexOf('?>', left);
            if (right >= 0) {
                const head = data.slice(left, right + 2).toString();
                const m = head.match(/encoding="(.*)"/);
                if (m) {
                    let encoding = m[1].toLowerCase();
                    if (encoding != 'utf-8') {
                        result = iconv.decode(data, encoding);
                        result = Buffer.from(result.toString().replace(m[0], 'encoding="utf-8"'));
                    }
                }
            }
        }

        return result;
    }

    convertHtml(data, isText) {
        let titleInfo = {};
        let desc = {_n: 'description', 'title-info': titleInfo};
        let pars = [];
        let body = {_n: 'body', section: {_a: []}};
        let fb2 = [desc, body];

        let title = '';
        let inTitle = false;

        let spaceCounter = [];

        const newParagraph = () => {
            pars.push({_n: 'p', _t: ''});
        };

        const growParagraph = (text) => {
            const l = pars.length;
            if (l) {
                if (pars[l - 1]._t == '')
                    text = text.trimLeft();
                pars[l - 1]._t += text;
            }

            //посчитаем отступы у текста, чтобы выделить потом параграфы
            const lines = text.split('\n');
            for (const line of lines) {
                const sp = line.split(' ');
                let l = 0;
                while (l < sp.length && sp[l].trim() == '') {
                    l++;
                }
                if (!spaceCounter[l])
                    spaceCounter[l] = 0;
                spaceCounter[l]++;
            }
        };

        newParagraph();
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
            innerCut: new Set(['head', 'script', 'style'])
        });

        titleInfo['book-title'] = title;

        //подозрение на чистый текст, надо разбить на параграфы
        if ((isText || pars.length < buf.length/2000) && spaceCounter.length) {
            let total = 0;
            for (let i = 0; i < spaceCounter.length; i++) {
                total += (spaceCounter[i] ? spaceCounter[i] : 0);
            }
            total /= 10;
            let i = spaceCounter.length - 1;
            while (i > 0 && (!spaceCounter[i] || spaceCounter[i] < total)) i--;

            const parIndent = i;
            if (parIndent > 0) {//нашли отступ параграфа

                let newPars = [];
                const newPar = () => {
                    newPars.push({_n: 'p', _t: ''});
                };

                const growPar = (text) => {
                    const l = newPars.length;
                    if (l) {
                        newPars[l - 1]._t += text;
                    }
                }

                for (const par of pars) {
                    newPar();

                    const lines = par._t.split('\n');
                    for (const line of lines) {
                        const sp = line.split(' ');
                        let l = 0;
                        while (l < sp.length && sp[l].trim() == '') {
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
        } else {
            body.section._a[0] = pars;
        }

        //убираем лишнее
        for (let i = 0; i < pars.length; i++)
            pars[i]._t = repSpaces(pars[i]._t).trim();

        return this.formatFb2(fb2);
    }

    convertSamlib(data) {
        let titleInfo = {};
        let desc = {_n: 'description', 'title-info': titleInfo};
        let pars = [];
        let body = {_n: 'body', section: {_a: pars}};
        let fb2 = [desc, body];

        let inSubtitle = false;
        let inJustify = true;
        let path = '';
        let tag = '';// eslint-disable-line no-unused-vars

        let inText = false;
        let node = {_a: pars};

        let inPara = false;
        let italic = false;
        let bold = false;

        const openTag = (name) => {
            if (name == 'p')
                inPara = true;
            let n = {_n: name, _a: [], _p: node};
            node._a.push(n);
            node = n;
        };

        const closeTag = (name) => {
            if (name == 'p')
                inPara = false;
            if (node._p) {
                const exact = (node._n == name);
                node = node._p;
                if (!exact)
                    closeTag(name);
            }
        };

        const growParagraph = (text) => {
            if (node._n == 'p' && node._a.length == 0)
                text = text.trimLeft();
            node._a.push({_t: text});
        };

        openTag('p');

        const onStartNode = (elemName, tail, singleTag, cutCounter, cutTag) => {// eslint-disable-line no-unused-vars
            if (elemName == '')
                return;
            if (!inText) {
                path += '/' + elemName;
                tag = elemName;
            } else {
                if (inPara && elemName != 'i' && elemName != 'b')
                    closeTag('p');

                switch (elemName) {
                    case 'li':
                    case 'p':
                    case 'dd':
                    case 'h1':
                    case 'h2':
                    case 'h3':
                        openTag('p');
                        break;
                    case 'i':
                        openTag('emphasis');
                        italic = true;
                        break;
                    case 'b':
                        openTag('strong');
                        bold = true;
                        break;
                    case 'div':
                        if (tail.indexOf('align="center"') >= 0) {
                            openTag('subtitle');
                            inSubtitle = true;
                        }

                        if (tail.indexOf('align="justify"') >= 0) {
                            openTag('p');
                            inJustify = true;
                        }

                        break;
                }
            }
        };

        const onEndNode = (elemName, tail, singleTag, cutCounter, cutTag) => {// eslint-disable-line no-unused-vars
            if (!inText) {
                const oldPath = path;
                let t = '';
                do  {
                    let i = path.lastIndexOf('/');
                    t = path.substr(i + 1);
                    path = path.substr(0, i);
                } while (t != elemName && path);

                if (t != elemName) {
                    path = oldPath;
                }

                let i = path.lastIndexOf('/');
                tag = path.substr(i + 1);
            } else {
                switch (elemName) {
                    case 'li':
                    case 'p':
                    case 'dd':
                    case 'h1':
                    case 'h2':
                    case 'h3':
                        closeTag('p');
                        break;
                    case 'i':
                        closeTag('emphasis');
                        italic = false;
                        break;
                    case 'b':
                        closeTag('strong');
                        bold = false;
                        break;
                    case 'div':
                        if (inSubtitle) {
                            closeTag('subtitle');
                            inSubtitle = false;
                        }

                        if (inJustify) {
                            closeTag('p');
                            inJustify = false;
                        }
                        break;
                }
            }
        };

        const onComment = (text) => {// eslint-disable-line no-unused-vars
            if (text == '--------- Собственно произведение -------------')
                inText = true;
            if (text == '-----------------------------------------------')
                inText = false;
        };

        const onTextNode = (text) => {// eslint-disable-line no-unused-vars
            if (text != ' ' && text.trim() == '')
                text = text.trim();

            if (text == '')
                return;

            switch (path) {
                case '/html/body/center/h2':
                    titleInfo['book-title'] = text;
                    return;
                case '/html/body/div/h3':
                    if (!titleInfo.author)
                        titleInfo.author = {};
                    text = text.replace(':', '').trim().split(' ');
                    if (text[0])
                        titleInfo.author['last-name'] = text[0];
                    if (text[1])
                        titleInfo.author['first-name'] = text[1];
                    if (text[2])
                        titleInfo.author['middle-name'] = text[2];
                    return;
            }

            let tOpen = (bold ? '<strong>' : '');
            tOpen += (italic ? '<emphasis>' : '');
            let tClose = (italic ? '</emphasis>' : '');
            tClose += (bold ? '</strong>' : '');

            if (inText)
                growParagraph(`${tOpen}${text}${tClose}`);
        };

        sax.parseSync(repSpaces(this.decode(data).toString()), {
            onStartNode, onEndNode, onTextNode, onComment,
            innerCut: new Set(['head', 'script', 'style'])
        });

        const title = (titleInfo['book-title'] ? titleInfo['book-title'] : '');
        let author = '';
        if (titleInfo.author) {
            author = _.compact([
                (titleInfo.author['last-name'] ? titleInfo.author['last-name'] : ''),
                (titleInfo.author['first-name'] ? titleInfo.author['first-name'] : ''),
                (titleInfo.author['middle-name'] ? titleInfo.author['middle-name'] : ''),
            ]).join(' ');
        }

        pars.unshift({_n: 'title', _a: [
            {_n: 'p', _t: author}, {_n: 'p', _t: ''},
            {_n: 'p', _t: title}, {_n: 'p', _t: ''},
        ]})

        return this.formatFb2(fb2);
    }

    formatFb2(fb2) {
        let out = '<?xml version="1.0" encoding="utf-8"?>';
        out += '<FictionBook xmlns="http://www.gribuser.ru/xml/fictionbook/2.0" xmlns:l="http://www.w3.org/1999/xlink">';
        out += this.formatFb2Node(fb2);
        out += '</FictionBook>';
        return out;
    }

    formatFb2Node(node, name) {
        let out = '';

        if (Array.isArray(node)) {
            for (const n of node) {
                out += this.formatFb2Node(n);
            }
        } else if (typeof node == 'string') {
            if (name)
                out += `<${name}>${repSpaces(node)}</${name}>`;
            else
                out += repSpaces(node);
        } else {
            if (node._n)
                name = node._n;

            if (name)
                out += `<${name}>`;
            if (node.hasOwnProperty('_t'))
                out += repSpaces(node._t);

            for (let nodeName in node) {
                if (nodeName && nodeName[0] == '_' && nodeName != '_a')
                    continue;

                const n = node[nodeName];
                out += this.formatFb2Node(n, nodeName);
            }
            
            if (name)
                out += `</${name}>`;
        }
        return out;
    }
}

module.exports = BookConverter;