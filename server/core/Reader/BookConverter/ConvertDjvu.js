const fs = require('fs-extra');
const path = require('path');
const utils = require('../../utils');

const ConvertHtml = require('./ConvertHtml');

class ConvertDjvu extends ConvertHtml {
    check(data, opts) {
        const {inputFiles} = opts;

        return this.config.useExternalBookConverter && 
            inputFiles.sourceFileType && inputFiles.sourceFileType.ext == 'djvu';
    }

    async run(data, opts) {
        if (!this.check(data, opts))
            return false;

        const {inputFiles, callback, abort, uploadFileName} = opts;

        const ddjvuPath = '/usr/bin/ddjvu';
        if (!await fs.pathExists(ddjvuPath))
            throw new Error('Внешний конвертер ddjvu не найден');

        const tiffsplitPath = '/usr/bin/tiffsplit';
        if (!await fs.pathExists(tiffsplitPath))
            throw new Error('Внешний конвертер tiffsplitPath не найден');

        const mogrifyPath = '/usr/bin/mogrify';
        if (!await fs.pathExists(mogrifyPath))
            throw new Error('Внешний конвертер mogrifyPath не найден');

        const dir = `${inputFiles.filesDir}/`;
        const inpFile = `${dir}${path.basename(inputFiles.sourceFile)}`;
        const tifFile = `${inpFile}.tif`;

        //конвертируем в tiff
        let perc = 0;
        await this.execConverter(ddjvuPath, ['-format=tiff', '-quality=50', '-verbose', inputFiles.sourceFile, tifFile], () => {
            perc = (perc < 100 ? perc + 1 : 40);
            callback(perc);
        }, abort);

        const tifFileSize = (await fs.stat(tifFile)).size;
        let limitSize = 3*this.config.maxUploadFileSize;
        if (tifFileSize > limitSize) {
            throw new Error(`Файл для конвертирования слишком большой|FORLOG| ${tifFileSize} > ${limitSize}`);
        }

        //разбиваем на файлы
        await this.execConverter(tiffsplitPath, [tifFile, dir], null, abort);

        await fs.remove(tifFile);

        //конвертируем в jpg
        await this.execConverter(mogrifyPath, ['-quality', '20', '-scale', '2048', '-verbose', '-format', 'jpg', `${dir}*.tif`], () => {
            perc = (perc < 100 ? perc + 1 : 40);
            callback(perc);
        }, abort);

        //читаем изображения
        const loadImage = async(image) => {
            image.data = (await fs.readFile(image.file)).toString('base64');
            image.name = path.basename(image.file);
        }

        let files = [];
        await utils.findFiles(async(file) => {
            if (path.extname(file) == '.jpg')
                files.push({name: file, base: path.basename(file)});
        }, dir);

        files.sort((a, b) => a.base.localeCompare(b.base));

        let images = [];
        let loading = [];
        files.forEach(f => {
            const image = {file: f.name};
            images.push(image);
            loading.push(loadImage(image));
        });

        await Promise.all(loading);

        //формируем текст
        limitSize = 2*this.config.maxUploadFileSize;
        let title = '';
        if (uploadFileName)
            title = uploadFileName;
        let text = `<title>${title}</title>`;
        for (const image of images) {
            text += `<fb2-image type="image/jpeg" name="${image.name}">${image.data}</fb2-image>`;

            if (text.length > limitSize) {
                throw new Error(`Файл для конвертирования слишком большой|FORLOG| text.length: ${text.length} > ${limitSize}`);
            }
        }
        return await super.run(Buffer.from(text), {skipCheck: true, isText: true, cutTitle: true});
    }
}

module.exports = ConvertDjvu;
