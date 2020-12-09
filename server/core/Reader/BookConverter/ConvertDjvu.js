const fs = require('fs-extra');
const path = require('path');
const utils = require('../../utils');

const ConvertBase = require('./ConvertBase');

class ConvertDjvu extends ConvertBase {
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
        limitSize = 2*this.config.maxUploadFileSize;
        let imagesSize = 0;

        const loadImage = async(image) => {
            image.data = (await fs.readFile(image.file)).toString('base64');
            image.name = path.basename(image.file);

            imagesSize += image.data.length;
            if (imagesSize > limitSize) {
                throw new Error(`Файл для конвертирования слишком большой|FORLOG| imagesSize: ${imagesSize} > ${limitSize}`);
            }
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

        //формируем fb2
        let titleInfo = {};
        let desc = {_n: 'description', 'title-info': titleInfo};
        let pars = [];
        let body = {_n: 'body', section: {_a: [pars]}};
        let binary = [];
        let fb2 = [desc, body, binary];

        let title = '';
        if (uploadFileName)
            title = uploadFileName;

        titleInfo['book-title'] = title;

        for (const image of images) {
            const img = {_n: 'binary', _attrs: {id: image.name, 'content-type': 'image/jpeg'}, _t: image.data};
            binary.push(img);

            pars.push({_n: 'p', _t: ''});
            pars.push({_n: 'image', _attrs: {'l:href': `#${image.name}`}});
        }

        return this.formatFb2(fb2);
    }
}

module.exports = ConvertDjvu;
