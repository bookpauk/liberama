const fs = require('fs-extra');
const path = require('path');
const utils = require('../../utils');

const sax = require('../../sax');

const ConvertJpegPng = require('./ConvertJpegPng');

class ConvertPdfImages extends ConvertJpegPng {
    check(data, opts) {
        const {inputFiles} = opts;

        return this.config.useExternalBookConverter && 
            inputFiles.sourceFileType && inputFiles.sourceFileType.ext == 'pdf';
    }

    async run(data, opts) {
        if (!this.check(data, opts))
            return false;

        let {inputFiles, callback, abort, pdfQuality} = opts;
        
        pdfQuality = (pdfQuality && pdfQuality <= 100 && pdfQuality >= 10 ? pdfQuality : 20);

        const pdftoppmPath = '/usr/bin/pdftoppm';
        if (!await fs.pathExists(pdftoppmPath))
            throw new Error('Внешний конвертер pdftoppm не найден');

        const pdftohtmlPath = '/usr/bin/pdftohtml';
        if (!await fs.pathExists(pdftohtmlPath))
            throw new Error('Внешний конвертер pdftohtml не найден');

        const inpFile = inputFiles.sourceFile;
        const dir = `${inputFiles.filesDir}/`;
        const outBasename = `${dir}${utils.randomHexString(10)}`;
        const outFile = `${outBasename}.tmp`;

        //конвертируем в jpeg
        let perc = 0;
        await this.execConverter(pdftoppmPath, ['-jpeg', '-jpegopt', `quality=${pdfQuality},progressive=y`, inpFile, outFile], () => {
            perc = (perc < 100 ? perc + 1 : 40);
            callback(perc);
        }, abort);

        const limitSize = 2*this.config.maxUploadFileSize;
        let jpgFilesSize = 0;

        //ищем изображения
        let files = [];
        await utils.findFiles(async(file) => {
            if (path.extname(file) == '.jpg') {
                jpgFilesSize += (await fs.stat(file)).size;
                if (jpgFilesSize > limitSize) {
                    throw new Error(`Файл для конвертирования слишком большой|FORLOG| jpgFilesSize: ${jpgFilesSize} > ${limitSize}`);
                }

                files.push({name: file, base: path.basename(file)});
            }
        }, dir);

        files.sort((a, b) => a.base.localeCompare(b.base));

        //схема документа (outline)
        const outXml = `${outBasename}.xml`;
        await this.execConverter(pdftohtmlPath, ['-nodrm', '-i', '-c', '-s', '-xml', inpFile, outXml], null, abort);
        const outline = [];

        let inOutline = 0;
        let inItem = false;
        let pageNum = 0;

        const onTextNode = (text, cutCounter, cutTag) => {// eslint-disable-line no-unused-vars
            if (inOutline > 0 && inItem && pageNum) {
                outline[pageNum] = text;
            }
        };

        const onStartNode = (tag, tail, singleTag, cutCounter, cutTag) => {// eslint-disable-line no-unused-vars
            if (tag == 'outline')
                inOutline++;

            if (inOutline > 0 && tag == 'item') {
                const attrs = sax.getAttrsSync(tail);
                pageNum = (attrs.page && attrs.page.value ? attrs.page.value : 0);
                inItem = true;
            }
        };

        const onEndNode = (tag, tail, singleTag, cutCounter, cutTag) => {// eslint-disable-line no-unused-vars
            if (tag == 'outline')
                inOutline--;
            if (tag == 'item')
                inItem = false;
        };

        const dataXml = await fs.readFile(outXml);
        const buf = this.decode(dataXml).toString();
        sax.parseSync(buf, {
            onStartNode, onEndNode, onTextNode
        });


        await utils.sleep(100);
        //формируем список файлов
        let i = 0;
        const imageFiles = files.map(f => {
            i++;
            let alt = (outline[i] ? outline[i] : '');
            return {src: f.name, alt};
        });
        return await super.run(data, Object.assign({}, opts, {imageFiles}));
    }
}

module.exports = ConvertPdfImages;
