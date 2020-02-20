const path = require('path');
const fs = require('fs');

//пример в коде:
//  @@include('./test/testFile.inc');

function includeRecursive(self, parentFile, source, depth) {
    depth = (depth ? depth : 0);
    if (depth > 50)
        throw new Error('includer: stack too big');
    const lines = source.split('\n');
    let result = [];
    for (const line of lines) {
        const trimmed = line.trim();
        const m = trimmed.match(/^@@[\s]*?include[\s]*?\(['"](.*)['"]\)/);
        if (m) {
            const includedFile = path.resolve(path.dirname(parentFile), m[1]);
            self.addDependency(includedFile);

            const fileContent = fs.readFileSync(includedFile, 'utf8');
            result = result.concat(includeRecursive(self, includedFile, fileContent, depth + 1));
        } else {
            result.push(line);
        }
    }
    return result;
}

exports.default = function includer(source) {
    return includeRecursive(this, this.resourcePath, source).join('\n');
}