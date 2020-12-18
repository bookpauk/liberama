const BaseController = require('./BaseController');
const ReaderWorker = require('../core/Reader/ReaderWorker');//singleton
const ReaderStorage = require('../core/Reader/ReaderStorage');//singleton
const WorkerState = require('../core/WorkerState');//singleton

class ReaderController extends BaseController {
    constructor(config) {
        super(config);
        this.readerStorage = new ReaderStorage();
        this.readerWorker = new ReaderWorker(config);
        this.workerState = new WorkerState();
    }

    async loadBook(req, res) {
        const request = req.body;
        let error = '';
        try {
            if (!request.url) 
                throw new Error(`key 'url' is empty`);
            const workerId = this.readerWorker.loadBookUrl({
                url: request.url, 
                enableSitesFilter: (request.hasOwnProperty('enableSitesFilter') ? request.enableSitesFilter : true),
                skipHtmlCheck: (request.hasOwnProperty('skipHtmlCheck') ? request.skipHtmlCheck : false),
                isText: (request.hasOwnProperty('isText') ? request.isText : false),
                uploadFileName: (request.hasOwnProperty('uploadFileName') ? request.uploadFileName : false),
                djvuQuality: (request.hasOwnProperty('djvuQuality') ? request.djvuQuality : false),
                pdfAsText: (request.hasOwnProperty('pdfAsText') ? request.pdfAsText : false),
                pdfQuality: (request.hasOwnProperty('pdfQuality') ? request.pdfQuality : false),
            });
            const state = this.workerState.getState(workerId);
            return (state ? state : {});
        } catch (e) {
            error = e.message;
        }
        //bad request
        res.status(400).send({error});
        return false;
    }

    async storage(req, res) {
        const request = req.body;
        let error = '';
        try {
            if (!request.action)
                throw new Error(`key 'action' is empty`);
            if (!request.items || Array.isArray(request.data))
                throw new Error(`key 'items' is empty`);

            return await this.readerStorage.doAction(request);
        } catch (e) {
            error = e.message;
        }
        //error
        res.status(500).send({error});
        return false;
    }

    async uploadFile(req, res) {
        const file = req.file;
        let error = '';
        try {
            const url = await this.readerWorker.saveFile(file);
            return {url};
        } catch (e) {
            error = e.message;
        }
        //bad request
        res.status(400).send({error});
        return false;
    }

    async restoreCachedFile(req, res) {
        const request = req.body;
        let error = '';
        try {
            if (!request.path) 
                throw new Error(`key 'path' is empty`);

            const workerId = this.readerWorker.restoreCachedFile(request.path);
            const state = this.workerState.getState(workerId);
            return (state ? state : {});
        } catch (e) {
            error = e.message;
        }
        //bad request
        res.status(400).send({error});
        return false;
    }
}

module.exports = ReaderController;
