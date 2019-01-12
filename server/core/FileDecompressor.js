const decompress = require('decompress');
const FileDetector = require('./FileDetector');

class FileDecompressor {
    constructor() {
        this.detector = new FileDetector();
    }

    async decompressFile(filename, outputDir) {
        const fileType = await this.detector.detectFile(filename);

        if (!(fileType.ext == 'zip' || fileType.ext == 'bz2'))
            return filename;

        const files = await decompress(filename, outputDir);

        let result = filename;
        let max = 0;
        if (files.length) {
            //ищем файл с максимальным размером
            for (let file of files) {
                if (file.data.length > max) {
                    result = `${outputDir}/${file.path}`;
                    max = file.data.length;
                }
            }
        }

        return result;
    }
}

module.exports = FileDecompressor;