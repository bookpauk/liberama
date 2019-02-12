const utils = require('./utils');

const cleanInterval = 3600; //sec
const cleanAfterLastModified = cleanInterval - 60; //sec

class WorkerState {
    constructor() {
        this.states = {};
        setTimeout(this.cleanStates.bind(this), cleanInterval*1000);
    }

    generateWorkerId() {
        return utils.randomHexString(20);
    }

    getControl(workerId) {
        return {
            set: state => this.setState(workerId, state),
            finish: state => this.finishState(workerId, state),
            get: workerId => this.getState(workerId),
        };
    }

    setState(workerId, state) {
        this.states[workerId] = Object.assign({}, this.states[workerId], state, {
            workerId, 
            lastModified: Date.now()
        });
    }

    finishState(workerId, state) {
        this.states[workerId] = Object.assign({}, this.states[workerId], state, {
            workerId,
            state: 'finish',
            lastModified: Date.now()
        });
    }

    getState(workerId) {
        return this.states[workerId];
    }

    cleanStates() {
        const now = Date.now();
        for (let workerID in this.states) {
            if ((now - this.states[workerID].lastModified) >= cleanAfterLastModified*1000) {
                delete this.states[workerID];
            }
        }
        setTimeout(this.cleanStates.bind(this), cleanInterval*1000);
    }
}

const workerState = new WorkerState();

module.exports = workerState;