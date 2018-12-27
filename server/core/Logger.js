/*
  Журналирование с буферизацией вывода
*/

const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));

global.LM_OK = 0;
global.LM_INFO = 1;
global.LM_WARN = 2;
global.LM_ERR = 3;
global.LM_FATAL = 4;
global.LM_TOTAL = 5;

const LOG_CACHE_BUFFER_SIZE  = 8192;
const LOG_BUFFER_FLUSH_INTERVAL = 200;

const LOG_ROTATE_FILE_LENGTH = 1000000;
const LOG_ROTATE_FILE_DEPTH  = 9;
const LOG_ROTATE_FILE_CHECK_INTERVAL = 60000;

let msgTypeToStr = {
    [LM_OK]:    '   OK',
    [LM_INFO]:  ' INFO',
    [LM_WARN]:  ' WARN',
    [LM_ERR]:   'ERROR',
    [LM_FATAL]: 'FATAL ERROR',
    [LM_TOTAL]: 'TOTAL'
};

class BaseLog {

    constructor(params) {
        this.params = params;
        this.exclude = new Set(params.exclude);
        this.outputBufferLength = 0;
        this.outputBuffer = [];
        this.flushing = false;
    }
    
    async flush() {
        if (this.flushing || !this.outputBufferLength)
            return;
        this.flushing = true;

        this.data = this.outputBuffer;
        this.outputBufferLength = 0;
        this.outputBuffer = [];

        await this.flushImpl(this.data)
            .catch(e => { console.log(e); process.exit(1); } );
        this.flushing = false;
    }

    log(msgType, message) {
        if (this.closed) { console.log(`Logger fatal error: log was closed (message to log: ${message}})`); process.exit(1); }

        if (!this.exclude.has(msgType)) {
            this.outputBuffer.push(message);
            this.outputBufferLength += message.length;

            if (this.outputBufferLength >= LOG_CACHE_BUFFER_SIZE && !this.flushing) {
                this.flush();
            }

            if (!this.iid) {
                this.iid = setInterval(() => {
                    if (!this.flushing) {
                        clearInterval(this.iid);
                        this.iid = 0;
                        this.flush();
                    }
                }, LOG_BUFFER_FLUSH_INTERVAL);
            }
        }
    }

    close() {
        if (this.closed)
            return;

        if (this.iid)
            clearInterval(this.iid);

        try {
            if (this.flushing)
                this.flushImplSync(this.data);
            this.flushImplSync(this.outputBuffer);
        } catch(e) {
            console.log(e);
            process.exit(1);
        }
        this.outputBufferLength = 0;
        this.outputBuffer = [];
        this.closed = true;
    }
}

class FileLog extends BaseLog {
    
    constructor(params) {
        super(params);
        this.fileName = params.fileName;
        this.fd = fs.openSync(this.fileName, 'a');
        this.rcid = 0;
    }

    close() {
        if (this.closed)
            return;
        super.close();
        if (this.fd)
            fs.closeSync(this.fd);
        if (this.rcid)
            clearTimeout(this.rcid);
    }

    async rotateFile(fileName, i) {
        let fn = fileName;
        if (i > 0)
            fn += `.${i}`;
        let tn = fileName + '.' + (i + 1);
        let exists = await fs.accessAsync(tn).then(() => true).catch(() => false);
        if (exists) {
            if (i >= LOG_ROTATE_FILE_DEPTH - 1) {
                await fs.unlinkAsync(tn);
            } else {
                await this.rotateFile(fileName, i + 1);
            }
        }
        await fs.renameAsync(fn, tn);
    }

    async doFileRotationIfNeeded() {
        this.rcid = 0;

        let stat = await fs.fstatAsync(this.fd);
        if (stat.size > LOG_ROTATE_FILE_LENGTH) {
            await fs.closeAsync(this.fd);
            await this.rotateFile(this.fileName, 0);
            this.fd = await fs.openAsync(this.fileName, "a");
        }
    }

    async flushImpl(data) {
        if (this.closed)
            return;

        if (!this.rcid) {
            await this.doFileRotationIfNeeded();
            this.rcid = setTimeout(() => {
                this.rcid = 0;
            }, LOG_ROTATE_FILE_CHECK_INTERVAL);
        };

        await fs.writeAsync(this.fd, Buffer.from(data.join('')));
    }

    flushImplSync(data) {
        fs.writeSync(this.fd, Buffer.from(data.join('')));
    }

}

class ConsoleLog extends BaseLog {
    async flushImpl(data) {
        process.stdout.write(data.join(''));
    }

    flushImplSync(data) {
        process.stdout.write(data.join(''));
    }
}

//------------------------------------------------------------------
const factory = {
    ConsoleLog,
    FileLog,
};

class Logger {

    constructor(params = null, cleanupCallback = null) {        
        this.handlers = [];
        if (params) {
            params.forEach((logParams) => {
                let className = logParams.log;
                let loggerClass = factory[className];
                this.handlers.push(new loggerClass(logParams));
            });
        } else {
            this.handlers.push(new DummyLog);
        }

        cleanupCallback = cleanupCallback || (() => {});
        this.cleanup(cleanupCallback);
    }

    prepareMessage(msgType, message) {
        return (new Date().toISOString()) + ` ${msgTypeToStr[msgType]}: ${message}\n`;
    }

    log(msgType, message) {
        if (message == null) {
            message = msgType;
            msgType = LM_INFO;
        }

        const mes = this.prepareMessage(msgType, message);

        for (let i = 0; i < this.handlers.length; i++)
            this.handlers[i].log(msgType, mes);
    }

    close() {
        for (let i = 0; i < this.handlers.length; i++)
            this.handlers[i].close();
    }

    cleanup(callback) {
        // attach user callback to the process event emitter
        // if no callback, it will still exit gracefully on Ctrl-C
        callback = callback || (() => {});
        process.on('cleanup', callback);

        // do app specific cleaning before exiting
        process.on('exit', () => {
            this.close();
            process.emit('cleanup');
        });

        // catch ctrl+c event and exit normally
        process.on('SIGINT', () => {
            this.log(LM_WARN, 'Ctrl-C pressed, exiting...');
            process.exit(2);
        });

        process.on('SIGTERM', () => {
            this.log(LM_WARN, 'Kill signal, exiting...');
            process.exit(2);
        });

        //catch uncaught exceptions, trace, then exit normally
        process.on('uncaughtException', e => {
            try {
                this.log(LM_FATAL, e.stack);
            } catch (e) {
                console.log(e.stack);
            }
            process.exit(99);
        });
    }
}

module.exports = Logger;