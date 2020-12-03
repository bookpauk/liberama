const fs = require('fs-extra');
const iconv = require('iconv-lite');
const he = require('he');

const LimitedQueue = require('../../LimitedQueue');
const textUtils = require('./textUtils');
const utils = require('../../utils');

const queue = new LimitedQueue(3, 20, 3*60*1000);//3 минуты ожидание подвижек

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

    async execConverter(path, args, onData, abort) {
        onData = (onData ? onData : () => {});
        
        let q = null;
        try {
            q = await queue.get(() => {onData();});
        } catch (e) {
            throw new Error('Слишком большая очередь конвертирования. Пожалуйста, попробуйте позже.');
        }

        try {
            const result = await utils.spawnProcess(path, {
                killAfter: 3600,//1 час
                args, 
                onData: (data) => {
                    q.resetTimeout();
                    onData(data);
                },
                //будем периодически проверять работу конвертера и если очереди нет, то разрешаем работу пинком onData
                onUsage: (stats) => {
                    if (queue.freed > 1 && stats.cpu >= 10)
                        onData('.');
                },
                abort
            });
            if (result.code != 0) {
                const error = `${result.code}|FORLOG|, exec: ${path}, args: ${args.join(' ')}, stdout: ${result.stdout}, stderr: ${result.stderr}`;
                throw new Error(`Внешний конвертер завершился с ошибкой: ${error}`);
            }
        } catch(e) {
            if (e.status == 'killed') {
                throw new Error('Слишком долгое ожидание конвертера');
            } else if (e.status == 'abort') {
                throw new Error('abort');
            } else if (e.status == 'error') {
                throw new Error(e.error);
            } else {
                throw new Error(e);
            }
        } finally {
            q.ret();
        }
    }

    decode(data) {
        let selected = textUtils.getEncoding(data);

        if (selected.toLowerCase() != 'utf-8')
            return iconv.decode(data, selected);
        else
            return data;
    }

    repSpaces(text) {
        return text.replace(/&nbsp;|[\t\n\r]/g, ' ');
    }

    escapeEntities(text) {
        return he.escape(he.decode(text.replace(/&nbsp;/g, ' ')));
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