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

        let {inputFiles, callback, abort, djvuQuality} = opts;

        djvuQuality = (djvuQuality && djvuQuality <= 100 && djvuQuality >= 10 ? djvuQuality : 20);
        let jpegQuality = djvuQuality;
        let tiffQuality = djvuQuality + 30;
        tiffQuality = (tiffQuality < 85 ? tiffQuality : 85);

        const ddjvuPath = '/usr/bin/ddjvu';
        if (!await fs.pathExists(ddjvuPath))
            throw new Error('Внешний конвертер ddjvu не найден');

        const djvusedPath = '/usr/bin/djvused';
        if (!await fs.pathExists(djvusedPath))
            throw new Error('Внешний конвертер djvused не найден');

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
        await this.execConverter(ddjvuPath, ['-format=tiff', `-quality=${tiffQuality}`, '-verbose', inputFiles.sourceFile, tifFile], () => {
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
        await this.execConverter(mogrifyPath, ['-quality', jpegQuality, '-scale', '2048>', '-verbose', '-format', 'jpg', `${dir}*.tif`], () => {
            perc = (perc < 100 ? perc + 1 : 40);
            callback(perc);
        }, abort);

        limitSize = 2*this.config.maxUploadFileSize;
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
        const djvusedResult = await this.execConverter(djvusedPath, ['-u', '-e', 'print-outline', inputFiles.sourceFile], null, abort);

        const outline = [];
        const lines = djvusedResult.stdout.match(/\(\s*".*"\s*?"#\d+"/g);
        if (lines) {
            lines.forEach(l => {
                const m = l.match(/"(.*)"\s*?"#(\d+)"/);
                if (m) {
                    const pageNum = m[2];
                    let s = outline[pageNum];
                    if (!s)
                        s = m[1].trim();
                    else
                        s += `${(s[s.length - 1] != '.' ? '.' : '')} ${m[1].trim()}`;

                    outline[pageNum] = s;
                }
            });
        }

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

module.exports = ConvertDjvu;
