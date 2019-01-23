const fs = require('fs-extra');
const URL = require('url').URL;
const iconv = require('iconv-lite');
const chardet = require('chardet');
const _ = require('lodash');

const FileDetector = require('../FileDetector');
const EasySAXParser = require('./easysaxmod');

class BookConverter {
    constructor() {
        this.detector = new FileDetector();
    }

    async convertToFb2(inputFile, outputFile, url, callback) {
        const fileType = await this.detector.detectFile(inputFile);
        
        if (fileType && (fileType.ext == 'html' || fileType.ext == 'xml')) {
            const data = await fs.readFile(inputFile);

            if (data.toString().indexOf('<FictionBook') >= 0) {            
                await fs.writeFile(outputFile, data);
                return;
            }

            const parsedUrl = new URL(url);
            if (parsedUrl.hostname == 'samlib.ru' ||
                parsedUrl.hostname == 'budclub.ru') {
                await fs.writeFile(outputFile, await this.convertSamlib(data));
                return;
            }

            //Заглушка
            await fs.writeFile(outputFile, await this.convertHtml(data));
            callback(100);
        } else {
            if (fileType)
                throw new Error(`unknown file format: ${fileType.mime}`);
            else
                throw new Error(`unsupported file format: ${url}`);
        }
    }

    decode(data) {
        const charsetAll = chardet.detectAll(data.slice(0, 10000));

        let selected = 'ISO-8859-1';
        for (const charset of charsetAll) {
            if (charset.name.indexOf('ISO-8859') < 0) {
                selected = charset.name;
                break;
            }
        }

        return iconv.decode(data, selected);
    }

    async convertHtml(data, isText) {
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
        const newPara = new Set(['TR', 'BR', 'BR/', 'DD', 'P', 'TITLE', '/TITLE', 'H1', 'H2', 'H3', '/H1', '/H2', '/H3']);

        const onText = (text) => {
            if (inTitle && !title)
                title = text;
        };

        const onNode = (elem) => {
            if (elem == 'TITLE')
                inTitle = true;
            else if (elem == '/TITLE')
                inTitle = false;
        };

        const innerCut = new Set(['HEAD', 'SCRIPT', 'STYLE']);
        let buf = this.decode(data).toString();
        buf = buf.replace(/&nbsp;/g, ' '); 

        let i = 0;
        const len = buf.length;
        let cutCounter = 0;
        let cutTag = '';
        while (i < len) {
            let left = buf.indexOf('<', i);
            if (left < 0)
                break;
            let right = buf.indexOf('>', left + 1);
            if (right < 0)
                break;

            let tag = buf.substr(left + 1, right - left - 1).trim().toUpperCase();
            const firstSpace = tag.indexOf(' ');
            if (firstSpace >= 0)
                tag = tag.substr(0, firstSpace);

            const text = buf.substr(i, left - i);
            if (!cutCounter) {
                growParagraph(text);
                if (newPara.has(tag))
                    newParagraph();
            }
            onText(text);
            onNode(tag);

            if (innerCut.has(tag) && (!cutCounter || cutTag == tag)) {
                if (!cutCounter)
                    cutTag = tag;
                cutCounter++;
            }

            if (tag != '' && tag.charAt(0) == '/' && cutTag == tag.substr(1)) {
                cutCounter = (cutCounter > 0 ? cutCounter - 1 : 0);
                if (!cutCounter)
                    cutTag = '';
            }

            i = right + 1;
        }

        if (i < len && !cutCounter)
            growParagraph(buf.substr(i, len - i));

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

        //убрать лишнее
        for (let p of body.section._a[0]) {
            p._t = p._t.replace(/[\t\n\r]/g, ' ');
        }

        return this.formatFb2(fb2);
    }

    async convertSamlib(data) {
        let titleInfo = {};
        let desc = {_n: 'description', 'title-info': titleInfo};
        let pars = [];
        let body = {_n: 'body', section: {_a: [pars]}};
        let fb2 = [desc, body];

        let path = '';
        let tag = '';// eslint-disable-line no-unused-vars

        let inText = false;
        let center = false;
        //let italic = false;
        //let bold = false;
        let node = {};

        const newParagraph = () => {
            node = {_n: 'p', _t: ''};
            pars.push(node);
        };

        const newSubTitle = () => {
            node = {_n: 'subtitle', _t: ''};
            pars.push(node);
        };

        const newItalic = () => {
            let n = {_n: 'emphasis', _t: ''};
            if (!node._a)
                node._a = [];
            node._a.push(n);
            node = n;
        };

        const newBold = () => {
            let n = {_n: 'strong', _t: ''};
            if (!node._a)
                node._a = [];
            node._a.push(n);
            node = n;
        };

        const growParagraph = (text) => {
            if (node._t == '')
                text = text.trimLeft();
            node._t += text;
        };

        newParagraph();

        const parser = new EasySAXParser();

        parser.on('error', (msgError) => {// eslint-disable-line no-unused-vars
        });

        parser.on('startNode', (elemName, getAttr, isTagEnd, getStrNode) => {// eslint-disable-line no-unused-vars
            if (!inText) {
                path += '/' + elemName;
                tag = elemName;
            } else {
                if (!center && (elemName == 'p' || elemName == 'dd')) {
                    newParagraph();
                }

                switch (elemName) {
                    case 'i':
                        newItalic();
                        //italic = true;
                        break;
                    case 'b':
                        newBold();
                        //bold = true;
                        break;
                    case 'div':
                        var a = getAttr();
                        if (a && a.align == 'center') {
                            newSubTitle();
                            center = true;
                        }
                        break;
                }
            }

        });

        parser.on('endNode', (elemName, isTagStart, getStrNode) => {// eslint-disable-line no-unused-vars
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
                    case 'i':
                        //italic = false;
                        break;
                    case 'b':
                        //bold = false;
                        break;
                    case 'div':
                        center = false;
                        break;
                }
            }
        });

        parser.on('textNode', (text) => {// eslint-disable-line no-unused-vars
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

            if (inText)
                growParagraph(text);
        });

        parser.on('cdata', (data) => {// eslint-disable-line no-unused-vars
        });

        parser.on('comment', (text) => {// eslint-disable-line no-unused-vars
            if (text == '--------- Собственно произведение -------------')
                inText = true;

            if (text == '-----------------------------------------------')
                inText = false;
        });

        /*
        parser.on('progress', async(progress) => {
            callback(...........);
        });
        */

        await parser.parse(this.decode(data));

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
            out += `<${name}>${node}</${name}>`;
        } else {
            if (node._n)
                name = node._n;
            if (!name)
                throw new Error(`malformed fb2 object`);

            out += `<${name}>`;
            if (node.hasOwnProperty('_t'))
                out += node._t;

            for (let nodeName in node) {
                if (nodeName == '_n' || nodeName == '_t')
                    continue;

                const n = node[nodeName];
                out += this.formatFb2Node(n, nodeName);
            }
            
            out += `</${name}>`;
        }
        return out;
    }
}

module.exports = BookConverter;