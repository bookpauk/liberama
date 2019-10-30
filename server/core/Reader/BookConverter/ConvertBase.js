const fs = require('fs-extra');
const iconv = require('iconv-lite');
const chardet = require('chardet');
const he = require('he');

const textUtils = require('./textUtils');
const utils = require('../../utils');

let execConverterCounter = 0;

class ConvertBase {
    constructor(config) {
        this.config = config;

        this.calibrePath = `${config.dataDir}/calibre/ebook-convert`;
        this.sofficePath = '/usr/bin/soffice';
        this.pdfToHtmlPath = '/usr/bin/pdftohtml';
    }

    async run(data, opts) {// eslint-disable-line no-unused-vars
        //override
    }

    async checkExternalConverterPresent() {
        if (!await fs.pathExists(this.calibrePath))
            throw new Error('Внешний конвертер calibre не найден');

        if (!await fs.pathExists(this.sofficePath))
            throw new Error('Внешний конвертер LibreOffice не найден');

        if (!await fs.pathExists(this.pdfToHtmlPath))
            throw new Error('Внешний конвертер pdftohtml не найден');
    }

    async execConverter(path, args, onData) {
        execConverterCounter++;
        try {
            if (execConverterCounter > 10)
                throw new Error('Слишком большая очередь конвертирования. Пожалуйста, попробуйте позже.');

            const result = await utils.spawnProcess(path, {args, onData});
            if (result.code != 0) {
                let error = result.code;
                if (this.config.branch == 'development')
                    error = `exec: ${path}, stdout: ${result.stdout}, stderr: ${result.stderr}`;
                throw new Error(`Внешний конвертер завершился с ошибкой: ${error}`);
            }
        } catch(e) {
            if (e.status == 'killed') {
                throw new Error('Слишком долгое ожидание конвертера');
            } else if (e.status == 'error') {
                throw new Error(e.error);
            } else {
                throw new Error(e);
            }
        } finally {
            execConverterCounter--;
        }
    }

    decode(data) {
        let selected = textUtils.getEncoding(data);

        if (selected == 'ISO-8859-5') {
            const charsetAll = chardet.detectAll(data.slice(0, 20000));
            for (const charset of charsetAll) {
                if (charset.name.indexOf('ISO-8859') < 0) {
                    selected = charset.name;
                    break;
                }
            }
        }

        if (selected.toLowerCase() != 'utf-8')
            return iconv.decode(data, selected);
        else
            return data;
    }

    repSpaces(text) {
        return text.replace(/&nbsp;|[\t\n\r]/g, ' ');
    }

    escapeEntities(text) {
        return he.escape(he.decode(text));
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
                out += `<${name}>${this.repSpaces(node)}</${name}>`;
            else
                out += this.repSpaces(node);
        } else {
            if (node._n)
                name = node._n;

            let attrs = '';
            if (node._attrs) {
                for (let attrName in node._attrs) {
                    attrs += ` ${attrName}="${node._attrs[attrName]}"`;
                }
            }

            let tOpen = '';
            let tBody = '';
            let tClose = '';
            if (name)
                tOpen += `<${name}${attrs}>`;
            if (node.hasOwnProperty('_t'))
                tBody += this.repSpaces(node._t);

            for (let nodeName in node) {
                if (nodeName && nodeName[0] == '_' && nodeName != '_a')
                    continue;

                const n = node[nodeName];
                tBody += this.formatFb2Node(n, nodeName);
            }
            
            if (name)
                tClose += `</${name}>`;

            if (attrs == '' && name == 'p' && tBody.trim() == '')
                out += '<empty-line/>'
            else
                out += `${tOpen}${tBody}${tClose}`;
        }
        return out;
    }
}

module.exports = ConvertBase;