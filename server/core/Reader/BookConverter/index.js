const fs = require('fs-extra');
const FileDetector = require('../../FileDetector');

//порядок важен
const convertClassFactory = [
    require('./ConvertEpub'),
    require('./ConvertPdf'),
    require('./ConvertRtf'),
    require('./ConvertDocX'),
    require('./ConvertFb3'),
    require('./ConvertDoc'),
    require('./ConvertMobi'),
    require('./ConvertFb2'),
    require('./ConvertSamlib'),
    require('./ConvertSites'),
    require('./ConvertHtml'),
];

class BookConverter {
    constructor(config) {
        this.detector = new FileDetector();

        this.convertFactory = [];
        for (const convertClass of convertClassFactory) {
            this.convertFactory.push(new convertClass(config));
        }
    }

    async convertToFb2(inputFiles, outputFile, opts, callback, abort) {
        if (abort && abort())
            throw new Error('abort');

        const selectedFileType = await this.detector.detectFile(inputFiles.selectedFile);
        const data = await fs.readFile(inputFiles.selectedFile);

        const convertOpts = Object.assign({}, opts, {inputFiles, callback, abort, dataType: selectedFileType});
        let result = false;
        for (const convert of this.convertFactory) {
            result = await convert.run(data, convertOpts);
            if (result) {
                await fs.writeFile(outputFile, result);
                break;
            }
        }

        if (!result && inputFiles.nesting) {
            result = await this.convertToFb2(inputFiles.nesting, outputFile, opts, callback, abort);
        }

        if (!result) {
            if (selectedFileType)
                throw new Error(`Этот формат файла не поддерживается: ${selectedFileType.mime}`);
            else {
                throw new Error(`Не удалось определить формат файла: ${opts.url}`);
            }
        }

        callback(100);
        return result;
    }
}

module.exports = BookConverter;