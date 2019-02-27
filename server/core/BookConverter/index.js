const fs = require('fs-extra');
const FileDetector = require('../FileDetector');

//порядок важен
const convertClassFactory = [
    //require('./ConvertDocX'),
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

    async convertToFb2(inputFile, outputFile, url, callback) {
        const fileType = await this.detector.detectFile(inputFile);
        
        const data = await fs.readFile(inputFile);
        let result = false;
        for (const convert of this.convertFactory) {
            result = convert.run(data, {inputFile, url, callback, fileType});
            if (result) {
                await fs.writeFile(outputFile, result);
                break;
            }
        }

        if (!result) {
            if (fileType)
                throw new Error(`Этот формат файла не поддерживается: ${fileType.mime}`);
            else {
                throw new Error(`Не удалось определить формат файла: ${url}`);
            }
        }

        callback(100);
    }
}

module.exports = BookConverter;