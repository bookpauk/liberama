const fs = require('fs-extra');
const path = require('path');

const ConvertPdf = require('./ConvertPdf');

class ConvertRtf extends ConvertPdf {
    check(data, opts) {
        const {inputFiles} = opts;

        return this.config.useExternalBookConverter && 
            inputFiles.sourceFileType && inputFiles.sourceFileType.ext == 'djvu';
    }

    async run(data, opts) {
        if (!this.check(data, opts))
            return false;
        await this.checkExternalConverterPresent();

        const {inputFiles, callback, abort} = opts;

        const outFile = `${inputFiles.filesDir}/${path.basename(inputFiles.sourceFile)}`;
        const pdfFile = `${outFile}.pdf`;

        let perc = 0;
        await this.execConverter(this.ddjvuPath, ['-format=pdf', '-quality=85', '-verbose', inputFiles.sourceFile, pdfFile], () => {
            perc = (perc < 100 ? perc + 1 : 40);
            callback(perc);
        }, abort);

        const pdfFileSize = (await fs.stat(pdfFile)).size;
        if (pdfFileSize > 2*this.config.maxUploadFileSize) {
            throw new Error(`Файл для конвертирования слишком большой|FORLOG| ${pdfFileSize} > ${2*this.config.maxUploadFileSize}`);
        }

        return await super.run(null, Object.assign({}, opts, {pdfFile, skipCheck: true}));
    }
}

module.exports = ConvertRtf;
