const BaseController = require('./BaseController');
const WorkerState = require('../core/WorkerState');//singleton
const utils = require('../core/utils');

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

    async getStateFinish(req, res) {
        const request = req.body;
        let error = '';
        try {
            if (!request.workerId)
                throw new Error(`key 'workerId' is wrong`);

            res.writeHead(200, {
                'Content-Type': 'text/json; charset=utf-8',
            });

            const splitter = '-- aod2t5hDXU32bUFyqlFE next status --';            
            const refreshPause = 300;
            let i = 0;
            let prevProgress = -1;
            let prevState = '';
            let state;
            while (1) {// eslint-disable-line no-constant-condition
                state = this.workerState.getState(request.workerId);
                if (!state) break;

                res.write(splitter + JSON.stringify(state));
                res.flush();

                if (state.state != 'finish')
                    await utils.sleep(refreshPause);
                else
                    break;

                i++;
                if (i > 2*60*1000/refreshPause) {//2 мин ждем телодвижений воркера
                    res.write(splitter + JSON.stringify({state: 'error', error: 'Слишком долгое время ожидания'}));
                    break;
                }
                i = (prevProgress != state.progress || prevState != state.state ? 1 : i);
                prevProgress = state.progress;
                prevState = state.state;
            }
            
            if (!state) {
                res.write(splitter + JSON.stringify({}));
            }

            res.end();
            return false;
        } catch (e) {
            error = e.message;
        }
        //bad request
        res.status(400).send({error});
        return false;
    }
}

module.exports = WorkerController;
