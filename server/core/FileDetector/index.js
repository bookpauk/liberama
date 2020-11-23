const fs = require('fs');
const signatures = require('./signatures.json');

class FileDetector {
    detectFile(filename) {
        return new Promise((resolve, reject) => {
            this.fromFile(filename, 10000, (err, result) => {
                if (err) reject(err);
                resolve(result);
            });
        });
    }

    //все, что ниже, взято здесь: https://github.com/dimapaloskin/detect-file-type
    fromFile(filePath, bufferLength, callback) {
        if (typeof bufferLength === 'function') {
            callback = bufferLength;
            bufferLength = undefined;
        }

        this.getFileSize(filePath, (err, fileSize) => {
            if (err) {
                return callback(err);
            }

            fs.open(filePath, 'r', (err, fd) => {
                if (err) {
                    return callback(err);
                }

                let bufferSize = bufferLength;
                if (!bufferSize) {
                    bufferSize = 500;
                }

                if (fileSize < bufferSize) {
                    bufferSize = fileSize;
                }

                const buffer = Buffer.alloc(bufferSize);

                fs.read(fd, buffer, 0, bufferSize, 0, (err) => {
                    fs.close(fd);

                    if (err) {
                      return callback(err);
                    }

                    this.fromBuffer(buffer, callback);
                });
            });
        });
    }

    fromBuffer(buffer, callback) {
        let result = null;
        //console.log(buffer);
        const invalidSignaturesList = this.validateSigantures();
        if (invalidSignaturesList.length) {
            return callback(invalidSignaturesList);
        }

        signatures.every((signature) => {
            if (this.detect(buffer, signature.rules)) {
                result = {
                    ext: signature.ext,
                    mime: signature.mime
                };

                if (signature.iana)
                    result.iana = signature.iana;

                return false;
            }
            return true;
        });

        callback(null, result);
    }

    detect(buffer, receivedRules, type) {
        if (!type) {
            type = 'and';
        }

        const rules = [...receivedRules];

        let isDetected = true;
        rules.every((rule) => {
            if (rule.type === 'equal') {
                const slicedHex = buffer.slice(rule.start || 0, rule.end || buffer.length).toString('hex');
                isDetected = (slicedHex === rule.bytes);
                return this.isReturnFalse(isDetected, type);
            }

            if (rule.type === 'notEqual') {
                const slicedHex = buffer.slice(rule.start || 0, rule.end || buffer.length).toString('hex');
                isDetected = !(slicedHex === rule.bytes);
                return this.isReturnFalse(isDetected, type);
            }

            if (rule.type === 'contains') {
                const slicedHex = buffer.slice(rule.start || 0, rule.end || buffer.length).toString('hex');
                if (typeof rule.bytes === 'string') {
                    rule.bytes = [rule.bytes];
                }

                rule.bytes.every((bytes) => {
                    isDetected = (slicedHex.indexOf(bytes) !== -1);
                    return isDetected;
                });

                return this.isReturnFalse(isDetected, type);
            }

            if (rule.type === 'notContains') {
                const slicedHex = buffer.slice(rule.start || 0, rule.end || buffer.length).toString('hex');
                if (typeof rule.bytes === 'string') {
                    rule.bytes = [rule.bytes];
                }

                rule.bytes.every((bytes) => {
                    isDetected = (slicedHex.indexOf(bytes) === -1);
                    return isDetected;
                });

                return this.isReturnFalse(isDetected, type);
            }

            if (rule.type === 'or') {
                isDetected = this.detect(buffer, rule.rules, 'or');
                return this.isReturnFalse(isDetected, type);
            }

            if (rule.type === 'and') {
                isDetected = this.detect(buffer, rule.rules, 'and');
                return this.isReturnFalse(isDetected, type);
            }

            return true;
        });

        return isDetected;
    }

    isReturnFalse(isDetected, type) {
        if (!isDetected && type === 'and') {
            return false;
        }

        if (isDetected && type === 'or') {
            return false;
        }

        return true;
    }

    validateRuleType(rule) {
        const types = ['or', 'and', 'contains', 'notContains', 'equal', 'notEqual'];
        return  (types.indexOf(rule.type) !== -1);
    }

    validateSigantures() {
        let invalidSignatures = signatures.map((signature) => {
            return this.validateSignature(signature);
        });

        invalidSignatures = this.cleanArray(invalidSignatures);

        if (invalidSignatures.length) {
            return invalidSignatures;
        }

        return true;
    }

    validateSignature(signature) {
        if (!('type' in signature)) {
            return {
                message: 'signature does not contain "type" field',
                signature
            };
        }

        if (!('ext' in signature)) {
            return {
                message: 'signature does not contain "ext" field',
                signature
            };
        }

        if (!('mime' in signature)) {
            return {
                message: 'signature does not contain "mime" field',
                signature
            };
        }

        if (!('rules' in signature)) {
            return {
                message: 'signature does not contain "rules" field',
                signature
            };
        }

        const invalidRules = this.validateRules(signature.rules);

        if (invalidRules && invalidRules.length) {
            return {
                message: 'signature has invalid rule',
                signature,
                rules: invalidRules
            }
        }
    }

    validateRules(rules) {
        let invalidRules = rules.map((rule) => {
            let isRuleTypeValid = this.validateRuleType(rule);

            if (!isRuleTypeValid) {
                return {
                    message: 'rule type does not supported',
                    rule
                };
            }

            if ((rule.type === 'or' || rule.type === 'and') && !('rules' in rule)) {
                return {
                    message: 'rule should contains "rules" field',
                    rule
                };
            }

            if (rule.type === 'or' || rule.type === 'and') {
                return this.validateRules(rule.rules);
            }

            return false;
        });

        invalidRules = this.cleanArray(invalidRules);

        if (invalidRules.length) {
            return invalidRules;
        }
    }

    cleanArray(actual) {
        let newArray = new Array();
        for (let i = 0; i < actual.length; i++) {
            if (actual[i]) {
                newArray.push(actual[i]);
            }
        }
        return newArray;
    }

    addSignature(signature) {
        signatures.push(signature);
    }

    getFileSize(filePath, callback) {
        fs.stat(filePath, (err, stat) => {
            if (err) {
                return callback(err);
            }

            return callback(null, stat.size);
        });
    }
}

module.exports = FileDetector;