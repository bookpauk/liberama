const fs = require('fs-extra');
const path = require('path');

const ConvertBase = require('./ConvertBase');

class ConvertMobi extends ConvertBase {
    async check(data, opts) {
        const {inputFiles} = opts;

        return (this.config.useExternalBookConverter && 
            inputFiles.sourceFileType && inputFiles.sourceFileType.ext == 'mobi');
    }

    async run(data, opts) {
        if (!await this.check(data, opts))
            return false;
        await this.checkExternalConverterPresent();

        const {inputFiles, callback, abort} = opts;

        const outFile = `${inputFiles.filesDir}/${path.basename(inputFiles.sourceFile)}`;
        const mobiFile = `${outFile}.mobi`;
        const fb2File = `${outFile}.fb2`;

        await fs.copy(inputFiles.sourceFile, mobiFile);

        let perc = 0;
        await this.execConverter(this.calibrePath, [mobiFile, fb2File, '-vv'], () => {
            perc = (perc < 100 ? perc + 1 : 50);
            callback(perc);
        }, abort);

        return await fs.readFile(fb2File);
    }
}

module.exports = ConvertMobi;
