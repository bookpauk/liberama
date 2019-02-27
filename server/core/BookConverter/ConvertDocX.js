const fs = require('fs-extra');
const path = require('path');

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

        const {inputFiles, callback} = opts;

        const outFile = `${inputFiles.fileListDir}/${path.basename(inputFiles.sourceFile)}`;
        const docxFile = `${outFile}.docx`;
        const fb2File = `${outFile}.fb2`;

        await fs.copy(inputFiles.sourceFile, docxFile);

        let perc = 0;
        await this.execConverter(this.calibrePath, [docxFile, fb2File], () => {
            perc = (perc < 100 ? perc + 5 : 50);
            callback(perc);
        });

        return await fs.readFile(fb2File);
    }
}

module.exports = ConvertDocX;
