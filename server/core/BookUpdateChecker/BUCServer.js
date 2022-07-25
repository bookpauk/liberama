const fs = require('fs-extra');

const FileDownloader = require('../FileDownloader');

const log = new (require('../AppLogger'))().log;//singleton

let instance = null;

//singleton
class BUCServer {
    constructor(config) {
        if (!instance) {
            this.config = Object.assign({}, config);
            
            this.config.tempDownloadDir = `${config.tempDir}/download`;
            fs.ensureDirSync(this.config.tempDownloadDir);

            this.down = new FileDownloader(config.maxUploadFileSize);
            
            instance = this;
        }

        return instance;
    }    

    async main() {
        try {
            //
            
            log(`---------------------------`);
            log(`Book Update checker started`);
            log(`---------------------------`);
        } catch (e) {
            log(LM_FATAL, e.stack);
        }
    }
}

module.exports = BUCServer;