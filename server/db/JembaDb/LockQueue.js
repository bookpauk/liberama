class LockQueue {
    constructor(queueSize) {
        this.queueSize = queueSize;
        this.freed = true;
        this.waitingQueue = [];
    }

    ret() {
        this.freed = true;
        if (this.waitingQueue.length) {
            this.waitingQueue.shift().onFreed();
        }
    }

    get(take = true) {
        return new Promise((resolve) => {
            if (this.freed) {
                if (take)
                    this.freed = false;
                resolve();
                return;
            }

            if (this.waitingQueue.length >= this.queueSize)
                throw new Error('Lock queue is too long');

            this.waitingQueue.push({
                onFreed: () => {
                    if (take)
                        this.freed = false;
                    resolve();
                },
            });
        });
    }
}

module.exports = LockQueue;