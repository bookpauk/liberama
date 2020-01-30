const fs = require('fs-extra');
const path = require('path');

const ConvertBase = require('./ConvertBase');

class ConvertDocX extends ConvertBase {
    async check(data, opts) {
        const {inputFiles} = opts;
        if (this.config.useExternalBookConverter && 
            inputFiles.sourceFileType && inputFiles.sourceFileType.ext == 'zip') {
            //ищем файл '[Content_Types].xml'
            for (const file of inputFiles.files) {
                if (file.path == '[Content_Types].xml') {
                    const contentTypes = await fs.readFile(`${inputFiles.filesDir}/${file.path}`, 'utf8');
                    return contentTypes.indexOf('/word/document.xml') >= 0;
                }
            }
        }

        return false;
    }

    async convert(docxFile, fb2File, callback, abort) {
        let perc = 0;
        await this.execConverter(this.calibrePath, [docxFile, fb2File, '-vv'], () => {
            perc = (perc < 100 ? perc + 1 : 50);
            callback(perc);
        }, abort);

        return await fs.readFile(fb2File);
    }

    async run(data, opts) {
        if (!(await this.check(data, opts)))
            return false;
        await this.checkExternalConverterPresent();

        const {inputFiles, callback, abort} = opts;

        const outFile = `${inputFiles.filesDir}/${path.basename(inputFiles.sourceFile)}`;
        const docxFile = `${outFile}.docx`;
        const fb2File = `${outFile}.fb2`;

        await fs.copy(inputFiles.sourceFile, docxFile);

        return await this.convert(docxFile, fb2File, callback, abort);
    }
}

module.exports = ConvertDocX;
