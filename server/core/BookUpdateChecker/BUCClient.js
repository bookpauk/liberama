const JembaConnManager = require('../../db/JembaConnManager');//singleton

const ayncExit = new (require('../AsyncExit'))();
const utils = require('../utils');
const log = new (require('../AppLogger'))().log;//singleton

const minuteMs = 60*1000;
const hourMs = 60*minuteMs;

let instance = null;

//singleton
class BUCClient {
    constructor(config) {
        if (!instance) {
            this.config = config;

            this.connManager = new JembaConnManager();
            this.db = this.connManager.db['book-update-server'];

            //константы
            if (this.config.branch !== 'development') {
                this.syncPeriod = 1*hourMs;//период синхронизации с сервером BUC
            } else {
                this.syncPeriod = 1*minuteMs;//период синхронизации с сервером BUC
            }

            this.fromCheckTime = 1;

            this.main();//no await

            instance = this;
        }

        return instance;
    }

    async checkBuc(bookUrls) {
        return [];
    }

    async findMaxCheckTime() {
        let result = 1;

        return result;
    }

    async main() {
        if (!this.config.bucEnabled)
            throw new Error('BookUpdateChecker disabled');

        try {
            this.fromCheckTime = await this.findMaxCheckTime();
            this.periodicSync();//no await

            log(`BUC Client started`);
        } catch (e) {
            log(LM_FATAL, e.stack);
            ayncExit.exit(1);
        }
    }
}

module.exports = BUCClient;