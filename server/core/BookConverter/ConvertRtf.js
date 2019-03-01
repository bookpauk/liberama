const fs = require('fs-extra');
const path = require('path');

const ConvertDocX = require('./ConvertDocX');

class ConvertRtf extends ConvertDocX {
    check(data, opts) {
        const {inputFiles} = opts;

        return this.config.useExternalBookConverter && 
            inputFiles.sourceFileType && inputFiles.sourceFileType.ext == 'rtf';
    }

    async run(data, opts) {
        if (!this.check(data, opts))
            return false;
        await this.checkExternalConverterPresent();

        const {inputFiles, callback} = opts;

        const outFile = `${inputFiles.filesDir}/${path.basename(inputFiles.sourceFile)}`;
        const rtfFile = `${outFile}.rtf`;
        const docxFile = `${outFile}.docx`;
        const fb2File = `${outFile}.fb2`;

        await fs.copy(inputFiles.sourceFile, rtfFile);
        await this.execConverter(this.sofficePath, ['--headless', '--convert-to', 'docx', '--outdir', inputFiles.filesDir, rtfFile]);

        return await super.convert(docxFile, fb2File, callback);
    }
}

module.exports = ConvertRtf;
