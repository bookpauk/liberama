const BaseController = require('./BaseController');
const WorkerState = require('../core/WorkerState');//singleton

class WorkerController extends BaseController {
    constructor(config) {
        super(config);
        this.workerState = new WorkerState();
    }

    async getState(req, res) {
        const request = req.body;
        let error = '';
        try {
            if (!request.workerId)
                throw new Error(`key 'workerId' is wrong`);

            const state = this.workerState.getState(request.workerId);
            return (state ? state : {});
        } catch (e) {
            error = e.message;
        }
        //bad request
        res.status(400).send({error});
        return false;
    }
}

module.exports = WorkerController;
