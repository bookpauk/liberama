import * as utils from '../share/utils';

const cleanPeriod = 60*1000;//1 минута

class WebSocketConnection {
    //messageLifeTime в минутах (cleanPeriod)
    constructor(messageLifeTime = 5) {
        this.ws = null;
        this.timer = null;
        this.listeners = [];
        this.messageQueue = [];
        this.messageLifeTime = messageLifeTime;
        this.requestId = 0;

        this.connecting = false;
    }

    addListener(listener) {
        if (this.listeners.indexOf(listener) < 0)
            this.listeners.push(Object.assign({regTime: Date.now()}, listener));
    }

    //рассылаем сообщение и удаляем те обработчики, которые его получили
    emit(mes, isError) {
        const len = this.listeners.length;
        if (len > 0) {
            let newListeners = [];
            for (const listener of this.listeners) {
                let emitted = false;
                if (isError) {
                    if (listener.onError)
                        listener.onError(mes);
                    emitted = true;
                } else {
                    if (listener.onMessage) {
                        if (listener.requestId) {
                            if (listener.requestId === mes.requestId) {
                                listener.onMessage(mes);
                                emitted = true;
                            }
                        } else {
                            listener.onMessage(mes);
                            emitted = true;
                        }
                    } else {
                        emitted = true;
                    }
                }

                if (!emitted)
                    newListeners.push(listener);
            }
            this.listeners = newListeners;
        }
        
        return this.listeners.length != len;
    }

    open(url) {
        return new Promise((resolve, reject) => { (async() => {
            //Ожидаем окончания процесса подключения, если open уже был вызван
            let i = 0;
            while (this.connecting && i < 200) {//10 сек
                await utils.sleep(50);
                i++;
            }
            if (i >= 200)
                this.connecting = false;

            //проверим подключение, и если нет, то подключимся заново
            if (this.ws && this.ws.readyState == WebSocket.OPEN) {
                resolve(this.ws);
            } else {
                this.connecting = true;
                const protocol = (window.location.protocol == 'https:' ? 'wss:' : 'ws:');

                url = url || `${protocol}//${window.location.host}/ws`;
                
console.log('new connection');
                this.ws = new WebSocket(url);

                if (this.timer) {
                    clearTimeout(this.timer);
                }
                this.timer = setTimeout(() => { this.periodicClean(); }, cleanPeriod);

                this.ws.onopen = (e) => {
console.log(this.ws.readyState);
                    this.connecting = false;
                    resolve(e);
                };

                this.ws.onmessage = (e) => {
                    try {
                        const mes = JSON.parse(e.data);
                        this.messageQueue.push({regTime: Date.now(), mes});

                        let newMessageQueue = [];
                        for (const message of this.messageQueue) {
                            if (!this.emit(message.mes)) {
                                newMessageQueue.push(message);
                            }
                        }

                        this.messageQueue = newMessageQueue;
                    } catch (e) {
                        this.emit(e.message, true);
                    }
                };

                this.ws.onerror = (e) => {
                    this.emit(e.message, true);
                    if (this.connecting) {
                        this.connecting = false;
                        reject(e);
                    }
                };
            }
        })() });
    }

    //timeout в минутах (cleanPeriod)
    message(requestId, timeout = 2) {
        return new Promise((resolve, reject) => {
            this.addListener({
                requestId,
                timeout,
                onMessage: (mes) => {
                    resolve(mes);
                },
                onError: (e) => {
                    reject(e);
                }
            });
        });
    }

    send(req) {
        if (this.ws && this.ws.readyState == WebSocket.OPEN) {
            const requestId = ++this.requestId;
            this.ws.send(JSON.stringify(Object.assign({requestId}, req)));
            return requestId;
        } else {
            throw new Error('WebSocket connection is not ready');
        }
    }

    close() {
        if (this.ws && this.ws.readyState == WebSocket.OPEN) {
            this.ws.close();
        }
    }

    periodicClean() {
        try {
            this.timer = null;

            const now = Date.now();
            //чистка listeners
            let newListeners = [];
            for (const listener of this.listeners) {
                if (now - listener.regTime < listener.timeout*cleanPeriod - 50) {
                    newListeners.push(listener);
                } else {
                    if (listener.onError)
                        listener.onError('Время ожидания ответа истекло');
                }
            }
            this.listeners = newListeners;

            //чистка messageQueue
            let newMessageQueue = [];
            for (const message of this.messageQueue) {
                if (now - message.regTime < this.messageLifeTime*cleanPeriod - 50) {
                    newMessageQueue.push(message);
                }
            }
            this.messageQueue = newMessageQueue;
        } finally {
            if (this.ws.readyState == WebSocket.OPEN) {
                this.timer = setTimeout(() => { this.periodicClean(); }, cleanPeriod);
            }
        }
    }
}

export default new WebSocketConnection();