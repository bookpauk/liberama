const fs = require('fs-extra');
const _ = require('lodash');

const propsToSave = [
    'servers'
];

async function load(config, configFilename) {
    if (!configFilename) {
        configFilename = `${config.dataDir}/config.json`;

        if (!await fs.pathExists(configFilename)) {
            save(config);
            return;
        }
    }

    const data = await fs.readFile(configFilename, 'utf8');
    Object.assign(config, JSON.parse(data));
}

async function save(config) {
    const configFilename = `${config.dataDir}/config.json`;
    const dataToSave = _.pick(config, propsToSave);

    await fs.writeFile(configFilename, JSON.stringify(dataToSave, null, 4));
}

module.exports = {
    load,
    save
};