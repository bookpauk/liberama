const ConvertBase = require('./ConvertBase');

class ConvertDocX extends ConvertBase {
    check(data, opts) {
        const {inputFiles} = opts;

        if (this.config.useExternalBookConverter && 
            inputFiles.sourceFileType && inputFiles.sourceFileType.ext == 'zip') {
            //ищем файл '[Content_Types].xml'
            for (const file of inputFiles.fileList) {
                if (file == '[Content_Types].xml') {
                    return true;
                }
            }
        }

        return false;
    }

    async run(data, opts) {
        if (!this.check(data, opts))
            return false;
        await this.checkExternalConverterPresent();

        

        return false;
    }
}

module.exports = ConvertDocX;
