const fs = require('fs-extra');
const iconv = require('iconv-lite');
const he = require('he');

const LimitedQueue = require('../../LimitedQueue');
const textUtils = require('./textUtils');
const utils = require('../../utils');
const xmlParser = require('../../xmlParser');

const queue = new LimitedQueue(3, 20, 2*60*1000);//2 минуты ожидание подвижек

class ConvertBase {
    constructor(config) {
        this.config = config;

        this.calibrePath = `${config.dataDir}/calibre/ebook-convert`;
        this.sofficePath = '/usr/bin/soffice';
    }

    async run(data, opts) {// eslint-disable-line no-unused-vars
        //override
    }

    async checkExternalConverterPresent() {
        if (!await fs.pathExists(this.calibrePath))
            throw new Error('Внешний конвертер calibre не найден');

        if (!await fs.pathExists(this.sofficePath))
            throw new Error('Внешний конвертер LibreOffice не найден');
    }

    async execConverter(path, args, onData, abort) {
        onData = (onData ? onData : () => {});
        
        let q = null;
        try {
            q = await queue.get(() => {onData();});
        } catch (e) {
            throw new Error('Слишком большая очередь конвертирования. Пожалуйста, попробуйте позже.');
        }

        abort = (abort ? abort : () => false);
        const myAbort = () => {
            return q.abort() || abort();
        }

        try {
            if (myAbort())
                throw new Error('abort');

            const result = await utils.spawnProcess(path, {
                killAfter: 3600,//1 час
                args, 
                onData: (data) => {
                    if (queue.freed > 0)
                        q.resetTimeout();
                    onData(data);
                },
                //будем периодически проверять работу конвертера и если очереди нет, то разрешаем работу пинком onData
                onUsage: (stats) => {
                    if (queue.freed > 0 && stats.cpu >= 10) {
                        q.resetTimeout();
                        onData('.');
                    }
                },
                onUsageInterval: 10,
                abort: myAbort
            });
            if (result.code != 0) {
                const error = `${result.code}|FORLOG|, exec: ${path}, args: ${args.join(' ')}, stdout: ${result.stdout}, stderr: ${result.stderr}`;
                throw new Error(`Внешний конвертер завершился с ошибкой: ${error}`);
            }
            return result;
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

    isDataXml(data) {
        const str = data.toString().trim();
        return (str.indexOf('<?xml version="1.0"') == 0 || str.indexOf('<?xml version=\'1.0\'') == 0 );
    }

    formatFb2(fb2) {
        const out = xmlParser.formatXml({
            FictionBook: {
                _attrs: {xmlns: 'http://www.gribuser.ru/xml/fictionbook/2.0', 'xmlns:l': 'http://www.w3.org/1999/xlink'},
                _a: [fb2],
            }
        }, 'utf-8', this.repSpaces);

        return out.replace(/<p>\s*?<\/p>/g, '<empty-line/>');
    }
}

module.exports = ConvertBase;