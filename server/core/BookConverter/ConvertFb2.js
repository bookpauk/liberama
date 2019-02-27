const ConvertBase = require('./ConvertBase');
const iconv = require('iconv-lite');

class ConvertFb2 extends ConvertBase {
    check(data, opts) {
        const {dataType} = opts;

        return (dataType && dataType.ext == 'xml' && data.toString().indexOf('<FictionBook') >= 0);
    }

    run(data, opts) {
        if (!this.check(data, opts))
            return false;

        return this.checkEncoding(data);
    }

    checkEncoding(data) {
        let result = data;

        const left = data.indexOf('<?xml version="1.0"');
        if (left >= 0) {
            const right = data.indexOf('?>', left);
            if (right >= 0) {
                const head = data.slice(left, right + 2).toString();
                const m = head.match(/encoding="(.*)"/);
                if (m) {
                    let encoding = m[1].toLowerCase();
                    if (encoding != 'utf-8') {
                        result = iconv.decode(data, encoding);
                        result = Buffer.from(result.toString().replace(m[0], 'encoding="utf-8"'));
                    }
                }
            }
        }

        return result;
    }
}

module.exports = ConvertFb2;
