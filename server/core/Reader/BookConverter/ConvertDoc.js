const fs = require('fs-extra');
const path = require('path');

const ConvertDocX = require('./ConvertDocX');

class ConvertDoc extends ConvertDocX {
    check(data, opts) {
        const {inputFiles} = opts;

        return this.config.useExternalBookConverter && 
            inputFiles.sourceFileType && inputFiles.sourceFileType.ext == 'msi';
    }

    async run(data, opts) {
        if (!this.check(data, opts))
            return false;
        await this.checkExternalConverterPresent();

        const {inputFiles, callback} = opts;

        const outFile = `${inputFiles.filesDir}/${path.basename(inputFiles.sourceFile)}`;
        const docFile = `${outFile}.doc`;
        const docxFile = `${outFile}.docx`;
        const fb2File = `${outFile}.fb2`;

        await fs.copy(inputFiles.sourceFile, docFile);
        await this.execConverter(this.sofficePath, ['--headless', '--convert-to', 'docx', '--outdir', inputFiles.filesDir, docFile]);

        return await super.convert(docxFile, fb2File, callback);
    }
}

module.exports = ConvertDoc;
