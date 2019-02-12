const BaseController = require('./BaseController');
const workerState =  require('../core/workerState');

class WorkerController extends BaseController {
    async getState(req, res) {
        const request = req.body;
        let error = '';
        try {
            if (!request.workerId)
                throw new Error(`key 'workerId' is wrong`);

            const state = workerState.getState(request.workerId);
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
