const fs = require('fs-extra');
const path = require('path');

const ConvertBase = require('./ConvertBase');

class ConvertEpub extends ConvertBase {
    async check(data, opts) {
        const {inputFiles} = opts;

        if (this.config.useExternalBookConverter && 
            inputFiles.sourceFileType && inputFiles.sourceFileType.ext == 'zip') {
            //ищем файл 'mimetype'
            for (const file of inputFiles.files) {
                if (file.path == 'mimetype') {
                    const mt = await fs.readFile(`${inputFiles.filesDir}/${file.path}`);
                    if (mt.toString().trim() == 'application/epub+zip')
                        return true;
                    break;
                }
            }
        }

        return false;
    }

    async run(data, opts) {
        if (!await this.check(data, opts))
            return false;
        await this.checkExternalConverterPresent();

        const {inputFiles, callback, abort} = opts;

        const outFile = `${inputFiles.filesDir}/${path.basename(inputFiles.sourceFile)}`;
        const epubFile = `${outFile}.epub`;
        const fb2File = `${outFile}.fb2`;

        await fs.copy(inputFiles.sourceFile, epubFile);

        let perc = 0;
        await this.execConverter(this.calibrePath, [epubFile, fb2File], () => {
            perc = (perc < 100 ? perc + 5 : 50);
            callback(perc);
        }, abort);

        return await fs.readFile(fb2File);
    }
}

module.exports = ConvertEpub;
