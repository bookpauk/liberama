const fs = require('fs-extra');
const FileDetector = require('../FileDetector');
const URL = require('url').URL;
const EasySAXParser = require('./easysax');

class BookConverter {
    constructor() {
        this.detector = new FileDetector();
    }

    async convertToFb2(inputFile, outputFile, url, callback) {
        const fileType = await this.detector.detectFile(inputFile);
        
        if (fileType && (fileType.ext == 'html' || fileType.ext == 'xml')) {
            const data = await fs.readFile(inputFile, 'utf8');

            if (data.indexOf('<FictionBook') >= 0) {            
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
            await fs.writeFile(outputFile, data);
            callback(100);
        } else {
            if (fileType)
                throw new Error(`unknown file format: ${fileType.mime}`);
            else
                throw new Error(`unsupported file format: ${url}`);
        }
    }

    async convertSamlib(data) {
        let fb2 = [{parentName: 'description'}];
        let path = '';
        let tag = '';

        let inText = false;

        const parser = new EasySAXParser();

        parser.on('error', (msgError) => {// eslint-disable-line no-unused-vars
        });

        parser.on('startNode', (elemName, getAttr, isTagEnd, getStrNode) => {// eslint-disable-line no-unused-vars
            if (elemName == 'xxx7')
                inText = !inText;

            if (!inText) {
                path += '/' + elemName;
                tag = elemName;
console.log(path);
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

    console.log('cl', elemName);            
    console.log('tag', tag);            
    console.log(path);
            }
        });

        parser.on('textNode', (text) => {// eslint-disable-line no-unused-vars
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

        await parser.parse(data);

        return this.formatFb2(fb2);
    }

    formatFb2(fb2) {
        let out = '<?xml version="1.0" encoding="utf-8"?>';
        out += '<FictionBook xmlns="http://www.gribuser.ru/xml/fictionbook/2.0" xmlns:l="http://www.w3.org/1999/xlink">';
        out += this.formatFb2Node(fb2);
        out += '</FictionBook>';
console.log(out);
        return out;
    }

    formatFb2Node(node, name) {
        let out = '';
        if (Array.isArray(node)) {
            for (const n of node) {
                out += this.formatFb2Node(n);
            }
        } else {
            if (node.parentName)
                name = node.parentName;
            if (!name)
                throw new Error(`malformed fb2 object`);

            out += `<${name}>`;
            for (let nodeName in node) {
                if (nodeName == 'parentName')
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