const ConvertBase = require('./ConvertBase');

class ConvertDocX extends ConvertBase {
    check(data, opts) {
        const {fileType} = opts;

        return (fileType && fileType.ext == 'docx' && this.config.useExternalBookConverter);
    }

    run(data, opts) {
        if (!this.check(data, opts))
            return false;

        return data;
    }
}

module.exports = ConvertDocX;
