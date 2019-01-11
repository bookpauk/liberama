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
            if (!request.type || !(request.type == 'url' || request.type == 'file'))
                throw new Error(`key 'type' is wrong`);

            if (request.type == 'file')
                throw new Error(`file loading is not supported yet`);

            if (request.type == 'url') {
                if (!request.url) 
                    throw new Error(`key 'url' is empty`);
                const workerId = this.readerWorker.loadBookUrl(request.url);
                const state = workerState.getState(workerId);
                return (state ? state : {});
            }
        } catch (e) {
            error = e.message;
        }
        //bad request
        res.status(400).send({error});
        return false;
    }
}

module.exports = ReaderController;
