const fs = require('fs');

const branchFilename = __dirname + '/application_env';

let branch = 'production';
try {
    fs.accessSync(branchFilename);
    branch = fs.readFileSync(branchFilename, 'utf8').trim();
} catch (err) {
}

process.env.NODE_ENV = branch;

const confFilename = __dirname + `/${branch}.js`;

fs.accessSync(confFilename);

module.exports = require(confFilename);