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
                await fs.writeFile(outputFile, await this.convertHtml(data));
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

    async convertHtml(data) {
        let titleInfo = {};
        let desc = {_n: 'description', 'title-info': titleInfo};
        let pars = [];
        let body = {_n: 'body', section: {_a: [pars]}};
        let fb2 = [desc, body];

        let path = '';
        let tag = '';// eslint-disable-line no-unused-vars

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
        };

        const parser = new EasySAXParser();

        parser.on('error', (msgError) => {// eslint-disable-line no-unused-vars
        });

        parser.on('startNode', (elemName, getAttr, isTagEnd, getStrNode) => {// eslint-disable-line no-unused-vars
            path += '/' + elemName;
            tag = elemName;

            if (elemName == 'p' || elemName == 'dd') {
                newParagraph();
            }
        });

        parser.on('endNode', (elemName, isTagStart, getStrNode) => {// eslint-disable-line no-unused-vars
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
        });

        parser.on('textNode', (text) => {// eslint-disable-line no-unused-vars
            if (text != ' ' && text.trim() == '')
                text = text.trim();

            if (text == '')
                return;

            switch (path) {
                case '/html/head/title':
                    titleInfo['book-title'] = text;
                    return;
            }

            growParagraph(text);
        });

        parser.on('cdata', (data) => {// eslint-disable-line no-unused-vars
        });

        parser.on('comment', (text) => {// eslint-disable-line no-unused-vars
        });

        /*
        parser.on('progress', async(progress) => {
            callback(...........);
        });
        */

        await parser.parse(this.decode(data));

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

        const newParagraph = () => {
            pars.push({_n: 'p', _t: ''});
        };

        const newSubTitle = () => {
            pars.push({_n: 'subtitle', _t: ''});
        };

        const growParagraph = (text) => {
            const l = pars.length;
            if (l) {
                if (pars[l - 1]._t == '')
                    text = text.trimLeft();
                pars[l - 1]._t += text;
            }
        };

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
                        growParagraph('<emphasis>');
                        break;
                    case 'b':
                        growParagraph('<strong>');
                        break;
                    case 'div':
                        var a = getAttr();
                        if (a && a.align == 'center') {
                            center = true;
                            newSubTitle();
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
                        growParagraph('</emphasis>');
                        break;
                    case 'b':
                        growParagraph('</strong>');
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
            if (node.hasOwnProperty('_t')) {
                out += node._t;
            } else {
                for (let nodeName in node) {
                    if (nodeName == '_n')
                        continue;

                    const n = node[nodeName];
                    out += this.formatFb2Node(n, nodeName);
                }
            }
            out += `</${name}>`;
        }
        return out;
    }
}

module.exports = BookConverter;