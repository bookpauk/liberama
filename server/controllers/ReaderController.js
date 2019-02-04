const BaseController = require('./BaseController');
const ReaderWorker =  require('../core/ReaderWorker');
const workerState =  require('../core/workerState');
//const log = require('../core/getLogger').getLog();
//const _ = require('lodash');

class ReaderController extends BaseController {
    constructor(connPool, config) {
        super(connPool, config);
        this.readerWorker = new ReaderWorker(config);
    }

    async loadBook(req, res) {
        const request = req.body;
        let error = '';
        try {
            if (!request.url) 
                throw new Error(`key 'url' is empty`);
            const workerId = this.readerWorker.loadBookUrl(request.url);
            const state = workerState.getState(workerId);
            return (state ? state : {});
        } catch (e) {
            error = e.message;
        }
        //bad request
        res.status(400).send({error});
        return false;
    }

    async uploadFile(req, res) {
        const file = req.file;
        let error = '';
        try {
            const url = await this.readerWorker.saveFile(file);
            return ({url});
        } catch (e) {
            error = e.message;
        }
        //bad request
        res.status(400).send({error});
        return false;
    }
}

module.exports = ReaderController;
