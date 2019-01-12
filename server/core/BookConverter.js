const fs = require('fs-extra');

class BookConverter {
    constructor() {
    }

    async convertToFb2(inputFile, outputFile, fileType, callback) {
        if (fileType.ext == 'html' || fileType.ext == 'xml') {
            const data = await fs.readFile(inputFile, 'utf8');

            if (data.indexOf('FictionBook') >= 0) {            
                await fs.writeFile(outputFile, data);
                return;
            }

            //Заглушка
            await fs.writeFile(outputFile, data);
            callback(100);
        } else {
            throw new Error(`unknown file format: ${fileType.mime}`);
        }
    }
}

module.exports = BookConverter;