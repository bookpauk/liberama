const fs = require('fs-extra');
const path = require('path');
const utils = require('../../utils');

const ConvertJpegPng = require('./ConvertJpegPng');

class ConvertDjvu extends ConvertJpegPng {
    check(data, opts) {
        const {inputFiles} = opts;

        return this.config.useExternalBookConverter && 
            inputFiles.sourceFileType && inputFiles.sourceFileType.ext == 'djvu';
    }

    async run(data, opts) {
        if (!this.check(data, opts))
            return false;

        const {inputFiles, callback, abort} = opts;

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
        const baseFile = `${dir}${path.basename(inputFiles.sourceFile)}`;
        const tifFile = `${baseFile}.tif`;

        //конвертируем в tiff
        let perc = 0;
        await this.execConverter(ddjvuPath, ['-format=tiff', '-quality=50', '-verbose', inputFiles.sourceFile, tifFile], () => {
            perc = (perc < 100 ? perc + 1 : 40);
            callback(perc);
        }, abort);

        const tifFileSize = (await fs.stat(tifFile)).size;
        let limitSize = 4*this.config.maxUploadFileSize;
        if (tifFileSize > limitSize) {
            throw new Error(`Файл для конвертирования слишком большой|FORLOG| tifFileSize: ${tifFileSize} > ${limitSize}`);
        }

        //разбиваем на файлы
        await this.execConverter(tiffsplitPath, [tifFile, dir], null, abort);

        await fs.remove(tifFile);

        //конвертируем в jpg
        await this.execConverter(mogrifyPath, ['-quality', '20', '-scale', '2048>', '-verbose', '-format', 'jpg', `${dir}*.tif`], () => {
            perc = (perc < 100 ? perc + 1 : 40);
            callback(perc);
        }, abort);

        //ищем изображения
        let files = [];
        await utils.findFiles(async(file) => {
            if (path.extname(file) == '.jpg')
                files.push({name: file, base: path.basename(file)});
        }, dir);

        files.sort((a, b) => a.base.localeCompare(b.base));

        await utils.sleep(100);
        return await super.run(data, Object.assign({}, opts, {imageFiles: files.map(f => f.name)}));
    }
}

module.exports = ConvertDjvu;
