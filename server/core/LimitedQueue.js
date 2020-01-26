const cleanPeriod = 60*1000;//1 минута
const cleanTimeout = 60;//timeout в минутах (cleanPeriod)

class LimitedQueue {
    constructor(enqueueAfter = 10, size = 100, timeout = cleanTimeout) {//timeout в минутах (cleanPeriod)
        this.size = size;
        this.timeout = timeout;

        this.freed = enqueueAfter;
        this.listeners = [];

        this.timer = setTimeout(() => { this.periodicClean(); }, cleanPeriod);
    }

    _addListener(listener) {
        this.listeners.push(Object.assign({regTime: Date.now()}, listener));
    }

    //отсылаем сообщение первому ожидающему и удаляем его из списка
    _emitFree() {
        if (this.listeners.length > 0) {
            let listener = this.listeners.shift();
            listener.onFree();

            const now = Date.now();
            for (let i = 0; i < this.listeners.length; i++) {
                listener = this.listeners[i];
                listener.regTime = now;
                listener.onPlaceChange(i + 1);
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

                let returned = false;
                return {
                    ret: () => {
                        if (!returned) {
                            this.freed++;
                            this._emitFree();
                            returned = true;
                        }
                    }
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

    destroy() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }

        for (const listener of this.listeners) {
            listener.onError('destroy');
        }
        this.listeners = [];

        this.destroyed = true;
    }

    periodicClean() {
        try {
            this.timer = null;

            const now = Date.now();
            //чистка listeners, убираем зависшие в очереди на одном месте
            let newListeners = [];
            for (const listener of this.listeners) {
                if (now - listener.regTime < this.timeout*cleanPeriod - 50) {
                    newListeners.push(listener);
                } else {
                    listener.onError('Время ожидания в очереди истекло');
                }
            }
            this.listeners = newListeners;
        } finally {
            if (!this.destroyed) {
                this.timer = setTimeout(() => { this.periodicClean(); }, cleanPeriod);
            }
        }
    }
}

module.exports = LimitedQueue;