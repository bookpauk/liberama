const fs = require('fs-extra');
const FileDetector = require('../FileDetector');

//порядок важен
const convertClassFactory = [
    require('./ConvertDocX'),
    require('./ConvertDoc'),
    require('./ConvertFb2'),
    require('./ConvertSamlib'),
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

    async convertToFb2(inputFiles, outputFile, url, callback) {
        const selectedFileType = await this.detector.detectFile(inputFiles.selectedFile);
        
        const data = await fs.readFile(inputFiles.selectedFile);
        let result = false;
        for (const convert of this.convertFactory) {
            result = await convert.run(data, {inputFiles, url, callback, dataType: selectedFileType});
            if (result) {
                await fs.writeFile(outputFile, result);
                break;
            }
        }

        if (!result) {
            if (selectedFileType)
                throw new Error(`Этот формат файла не поддерживается: ${selectedFileType.mime}`);
            else {
                throw new Error(`Не удалось определить формат файла: ${url}`);
            }
        }

        callback(100);
    }
}

module.exports = BookConverter;