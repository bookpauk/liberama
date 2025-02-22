import wsc from './webSocketConnection';

class Misc {
    async loadConfig(_configHash) {

        const query = {
            params: [
                'name', 'version', 'mode', 'maxUploadFileSize', 'useExternalBookConverter',
                'acceptFileExt', 'bucEnabled', 'branch', 'networkLibraryLink', 'restricted'
            ],
            _configHash,
        };

        const config = await wsc.message(await wsc.send(Object.assign({action: 'get-config'}, query)));
        if (config.error)
            throw new Error(config.error);

        return config;
    }
}

export default new Misc();