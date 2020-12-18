const fs = require('fs-extra');
const path = require('path');
const utils = require('../../utils');

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

        const dir = `${inputFiles.filesDir}/`;
        const baseFile = `${dir}${path.basename(inputFiles.sourceFile)}`;
        const jpgFiles = `${baseFile}.tmp`;

        //конвертируем в jpeg
        let perc = 0;
        await this.execConverter(pdftoppmPath, ['-jpeg', '-jpegopt', `quality=${pdfQuality},progressive=y`, inputFiles.sourceFile, jpgFiles], () => {
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
        //const djvusedResult = await this.execConverter(djvusedPath, ['-u', '-e', 'print-outline', inputFiles.sourceFile]);
        const outline = [];
        /*const lines = djvusedResult.stdout.match(/\(".*"\s*?"#\d+".*?\)/g);
        if (lines) {
            lines.forEach(l => {
                const m = l.match(/"(.*)"\s*?"#(\d+)"/);
                if (m) {
                    outline[m[2]] = m[1];
                }
            });
        }*/

        await utils.sleep(100);
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
