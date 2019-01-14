const fs = require('fs-extra');
const FileDetector = require('./FileDetector');

class BookConverter {
    constructor() {
        this.detector = new FileDetector();
    }

    async convertToFb2(inputFile, outputFile, url, callback) {
        const fileType = await this.detector.detectFile(inputFile);
        
        if (fileType && (fileType.ext == 'html' || fileType.ext == 'xml')) {
            const data = await fs.readFile(inputFile, 'utf8');

            if (data.indexOf('<FictionBook') >= 0) {            
                await fs.writeFile(outputFile, data);
                return;
            }

            //Заглушка
            await fs.writeFile(outputFile, data);
            callback(100);
        } else {
            if (fileType)
                throw new Error(`unknown file format: ${fileType.mime}`);
            else
                throw new Error(`unsupported file format: ${url}`);
        }
    }
}

module.exports = BookConverter;