const ConvertBase = require('./ConvertBase');
const iconv = require('iconv-lite');
const textUtils = require('./textUtils');

class ConvertFb2 extends ConvertBase {
    check(data, opts) {
        const {dataType} = opts;

        return (
            ( (dataType && dataType.ext == 'xml') || this.isDataXml(data) ) && 
            data.toString().indexOf('<FictionBook') >= 0
        );
    }

    async run(data, opts) {
        let newData = data;

        //Корректируем кодировку, 16-битные кодировки должны стать utf-8
        const encoding = textUtils.getEncoding(newData);
        if (encoding.indexOf('UTF-16') == 0) {
            newData = Buffer.from(iconv.decode(newData, encoding));
        }

        if (!this.check(newData, opts))
            return false;

        //Корректируем пробелы, всякие файлы попадаются :(
        if (newData[0] == 32) {
            newData = Buffer.from(newData.toString().trim());
        }

        return this.checkEncoding(newData);
    }

    checkEncoding(data) {
        let result = data;

        let q = '"';
        let left = data.indexOf('<?xml version="1.0"');
        if (left < 0) {
            left = data.indexOf('<?xml version=\'1.0\'');
            q = '\'';
        }

        if (left >= 0) {
            const right = data.indexOf('?>', left);
            if (right >= 0) {
                const head = data.slice(left, right + 2).toString();
                const m = head.match(/encoding=['"](.*?)['"]/);
                if (m) {
                    let encoding = m[1].toLowerCase();
                    if (encoding != 'utf-8') {
                        //encoding может не соответсвовать реальной кодировке файла, поэтому:
                        let calcEncoding = textUtils.getEncoding(data);
                        if (calcEncoding.indexOf('ISO-8859') >= 0) {
                            calcEncoding = encoding;
                        }

                        result = iconv.decode(data, calcEncoding);
                        result = Buffer.from(result.toString().replace(m[0], `encoding=${q}utf-8${q}`));
                    }
                }
            }
        }

        return result;
    }
}

module.exports = ConvertFb2;
