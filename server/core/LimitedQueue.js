class LimitedQueue {
    constructor(enqueueAfter = 10, size = 100, timeout = 60*60*1000) {//timeout в ms
        this.size = size;
        this.timeout = timeout;

        this.abortCount = 0;
        this.enqueueAfter = enqueueAfter;
        this.freed = enqueueAfter;
        this.listeners = [];
    }

    _addListener(listener) {
        this.listeners.push(listener);
    }

    //отсылаем сообщение первому ожидающему и удаляем его из списка
    _emitFree() {
        if (this.listeners.length > 0) {
            let listener = this.listeners.shift();
            listener.onFree();

            for (let i = 0; i < this.listeners.length; i++) {
                this.listeners[i].onPlaceChange(i + 1);
            }
        }
    }

    get(onPlaceChange) {
        return new Promise((resolve, reject) => {
            if (this.destroyed)
                reject('destroyed');

            const take = () => {
                if (this.freed <= 0)
                    throw new Error('Ошибка получения ресурсов в очереди ожидания');

                this.freed--;
                this.resetTimeout();

                let aCount = this.abortCount;
                return {
                    ret: () => {
                        if (aCount == this.abortCount) {
                            this.freed++;
                            this._emitFree();
                            aCount = -1;
                            this.resetTimeout();
                        }
                    },
                    abort: () => {
                        return (aCount != this.abortCount);
                    },
                    resetTimeout: this.resetTimeout.bind(this)
                };
            };

            if (this.freed > 0) {
                resolve(take());
            } else {
                if (this.listeners.length < this.size) {
                    this._addListener({
                        onFree: () => {
                            resolve(take());
                        },
                        onError: (err) => {
                            reject(err);
                        },
                        onPlaceChange: (i) => {
                            if (onPlaceChange)
                                onPlaceChange(i);
                        }
                    });
                    if (onPlaceChange)
                        onPlaceChange(this.listeners.length);
                } else {
                    reject('Превышен размер очереди ожидания');
                }
            }
        });
    }

    resetTimeout() {
        if (this.timer)
            clearTimeout(this.timer);
        this.timer = setTimeout(() => { this.clean(); }, this.timeout);
    }

    clean() {
        this.timer = null;

        if (this.freed < this.enqueueAfter) {
            this.abortCount++;
            //чистка listeners
            for (const listener of this.listeners) {
                listener.onError('Время ожидания в очереди истекло');
            }
            this.listeners = [];

            this.freed = this.enqueueAfter;
        }
    }

    destroy() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }

        for (const listener of this.listeners) {
            listener.onError('destroy');
        }
        this.listeners = [];
        this.abortCount++;

        this.destroyed = true;
    }
}

module.exports = LimitedQueue;