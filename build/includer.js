const path = require('path');
const fs = require('fs');

//пример в коде:
//  @@include('./test/testFile.inc');

exports.default = function includer(source) {
    const lines = source.split('\n');

    let result = [];
    for (const line of lines) {
        const trimmed = line.trim();
        const m = trimmed.match(/^@@[\s]*?include[\s]*?\(['"](.*)['"]\)/);
        if (m) {
            const includedFile = path.resolve(path.dirname(this.resourcePath), m[1]);
            const fileContent = fs.readFileSync(includedFile, 'utf8');
            result.push(fileContent);
            this.addDependency(includedFile);
        } else {
            result.push(line);
        }
    }
    return result.join('\n');
}