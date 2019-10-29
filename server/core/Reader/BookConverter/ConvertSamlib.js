const _ = require('lodash');
const URL = require('url').URL;

const sax = require('./sax');
const ConvertBase = require('./ConvertBase');

class ConvertSamlib extends ConvertBase {
    check(data, opts) {
        const {url, dataType} = opts;

        const parsedUrl = new URL(url);
        if (dataType && dataType.ext == 'html' &&
            (parsedUrl.hostname == 'samlib.ru' ||
            parsedUrl.hostname == 'budclub.ru' ||
            parsedUrl.hostname == 'zhurnal.lib.ru')) {
            return {hostname: parsedUrl.hostname};
        }

        return false;
    }

    async run(data, opts) {
        if (!opts.enableSitesFilter)
            return false;

        const checkResult = this.check(data, opts);
        if (!checkResult)
            return false;

        const {hostname} = checkResult;
        let titleInfo = {};
        let desc = {_n: 'description', 'title-info': titleInfo};
        let pars = [];
        let body = {_n: 'body', section: {_a: pars}};
        let fb2 = [desc, body];

        let inSubtitle = false;
        let inJustify = true;
        let inImage = false;
        let isFirstPara = false;
        let path = '';
        let tag = '';// eslint-disable-line no-unused-vars

        let inText = false;
        let textFound = false;
        let node = {_a: pars};

        let inPara = false;
        let italic = false;
        let bold = false;

        const openTag = (name, attrs) => {
            if (name == 'p')
                inPara = true;
            let n = {_n: name, _attrs: attrs, _a: [], _p: node};
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
            if (!node._p) {
                if (text.trim() != '')
                    openTag('p');
                else
                    return;
            }
            if (node._n == 'p' && node._a.length == 0)
                text = text.trimLeft();
            node._a.push({_t: text});
        };

        const onStartNode = (elemName, tail, singleTag, cutCounter, cutTag) => {// eslint-disable-line no-unused-vars
            if (elemName == '')
                return;
            if (!inText) {
                path += '/' + elemName;
                tag = elemName;
            } else {
                switch (elemName) {
                    case 'li':
                    case 'p':
                    case 'dd':
                    case 'br':
                        if (!(inSubtitle && isFirstPara)) {
                            if (inPara)
                                closeTag('p');
                            openTag('p');
                        }
                        isFirstPara = false;
                        break;
                    case 'h1':
                    case 'h2':
                    case 'h3':
                        if (inPara)
                            closeTag('p');
                        openTag('p');
                        bold = true;
                        break;
                    case 'i':
                    case 'em':
                        italic = true;
                        break;
                    case 'b':
                    case 'strong':
                        bold = true;
                        break;
                    case 'div':
                        if (inPara)
                            closeTag('p');
                        if (tail.indexOf('align="center"') >= 0) {
                            openTag('subtitle');
                            inSubtitle = true;
                            isFirstPara = true;
                        }

                        if (tail.indexOf('align="justify"') >= 0) {
                            openTag('p');
                            inJustify = true;
                        }

                        break;
                    case 'img': {
                        if (inPara)
                            closeTag('p');
                        const attrs = sax.getAttrsSync(tail);
                        if (attrs.src && attrs.src.value) {
                            let href = attrs.src.value;
                            if (href[0] == '/')
                                href = `http://${hostname}${href}`;
                            openTag('image', {'l:href': href});
                            inImage = true;
                        }
                        break;
                    }
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
                        closeTag('p');
                        break;
                    case 'h1':
                    case 'h2':
                    case 'h3':
                        closeTag('p');
                        bold = false;
                        break;
                    case 'i':
                    case 'em':
                        italic = false;
                        break;
                    case 'b':
                    case 'strong':
                        bold = false;
                        break;
                    case 'div':
                        if (inSubtitle) {
                            closeTag('subtitle');
                            inSubtitle = false;
                            isFirstPara = false;
                        }

                        if (inJustify) {
                            closeTag('p');
                            inJustify = false;
                        }
                        break;
                    case 'img':
                        if (inImage)
                            closeTag('image');
                        inImage = false;
                        break;
                }
            }
        };

        const onComment = (text) => {// eslint-disable-line no-unused-vars
            if (text == '--------- Собственно произведение -------------') {
                inText = true;
                textFound = true;
            }
            if (text == '-----------------------------------------------')
                inText = false;
        };

        const onTextNode = (text) => {// eslint-disable-line no-unused-vars
            if (text && text.trim() == '')
                text = (text.indexOf(' ') >= 0 ? ' ' : '');

            if (!text)
                return;

            text = this.escapeEntities(text);

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

        sax.parseSync(this.decode(data).toString().replace(/&nbsp;/g, ' '), {
            onStartNode, onEndNode, onTextNode, onComment,
            innerCut: new Set(['head', 'script', 'style'])
        });

        //текст не найден на странице, обработать корректно не получилось
        if (!textFound)
            return false;

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

}

module.exports = ConvertSamlib;
