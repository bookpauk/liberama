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
    }
}

module.exports = BUCServer;