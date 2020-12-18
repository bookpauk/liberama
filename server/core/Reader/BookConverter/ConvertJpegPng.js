const fs = require('fs-extra');
const path = require('path');
//const utils = require('../../utils');

const ConvertBase = require('./ConvertBase');

class ConvertJpegPng extends ConvertBase {
    check(data, opts) {
        const {inputFiles} = opts;

        return this.config.useExternalBookConverter && 
            inputFiles.sourceFileType && 
            (inputFiles.sourceFileType.ext == 'jpg' || inputFiles.sourceFileType.ext == 'png' );
    }

    async run(data, opts) {
        const {inputFiles, uploadFileName, imageFiles} = opts;

        if (!imageFiles) {
            if (!this.check(data, opts))
                return false;
        }

        let files = [];
        if (imageFiles) {
            files = imageFiles;
        } else {
            const imageFile = `${inputFiles.filesDir}/${path.basename(inputFiles.sourceFile)}.${inputFiles.sourceFileType.ext}`;
            await fs.copy(inputFiles.sourceFile, imageFile);
            files.push({src: imageFile});
        }

        //читаем изображения
        const limitSize = 2*this.config.maxUploadFileSize;
        let imagesSize = 0;

        const loadImage = async(image) => {
            const src = path.parse(image.src);
            let type = 'unknown';
            switch (src.ext) {
                case '.jpg': type = 'image/jpeg'; break;
                case '.png': type = 'image/png'; break;
            }
            if (type != 'unknown') {
                image.data = (await fs.readFile(image.src)).toString('base64');
                image.type = type;
                image.name = src.base;

                imagesSize += image.data.length;
                if (imagesSize > limitSize) {
                    throw new Error(`Файл для конвертирования слишком большой|FORLOG| imagesSize: ${imagesSize} > ${limitSize}`);
                }
            }
        }

        let images = [];
        let loading = [];
        files.forEach(img => {
            images.push(img);
            loading.push(loadImage(img));
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
            if (image.type) {
                const img = {_n: 'binary', _attrs: {id: image.name, 'content-type': image.type}, _t: image.data};
                binary.push(img);

                const attrs = {'l:href': `#${image.name}`};
                if (image.alt) {
                    image.alt = (image.alt.length > 256 ? image.alt.substring(0, 256) : image.alt);
                    attrs.alt = image.alt;
                }

                pars.push({_n: 'p', _t: ''});
                pars.push({_n: 'image', _attrs: attrs});
            }
        }
        pars.push({_n: 'p', _t: ''});
        
        return this.formatFb2(fb2);
    }
}

module.exports = ConvertJpegPng;
