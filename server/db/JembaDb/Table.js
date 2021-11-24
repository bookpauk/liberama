const fs = require('fs').promises;
const utils = require('./utils');

const TableReducer = require('./TableReducer');
const TableRowsMem = require('./TableRowsMem');
const TableRowsFile = require('./TableRowsFile');
const LockQueue = require('./LockQueue');

const maxChangesLength = 10;

class Table {
    constructor() {
        this.rowsInterface = new TableRowsMem();

        this.autoIncrement = 0;
        this.fileError = '';

        this.openingLock = new LockQueue(100);
        this.lock = new LockQueue(100);

        this.opened = false;
        this.closed = false;
        this.deltaStep = 0;
        this.changes = [];

        //table options defaults
        this.inMemory = false;
        this.compressed = 0;
        this.cacheSize = 5;
        this.compressed = 0;
        this.recreate = false;
        this.autoRepair = false;
        this.forceFileClosing = false;
    }

    checkErrors() {
        if (this.fileError)
            throw new Error(this.fileError);

        if (this.closed)
            throw new Error('Table closed');

        if (!this.opened)
            throw new Error('Table has not been opened yet');
    }

    async waitForSaveChanges() {
        if (this.changes.length > maxChangesLength) {
            let i = this.changes.length - maxChangesLength;
            while (i > 0 && this.changes.length > maxChangesLength) {
                i--;
                await utils.sleep(10);
            }
        }
    }

    async recreateTable() {
        const tempTablePath = `${this.tablePath}___temporary_recreating`;
        await fs.rmdir(tempTablePath, { recursive: true });
        await fs.mkdir(tempTablePath, { recursive: true });

        const tableRowsFileSrc = new TableRowsFile(this.tablePath, this.cacheSize);

        const tableRowsFileDest = new TableRowsFile(tempTablePath, this.cacheSize, this.compressed);
        const reducerDest = new TableReducer(false, tempTablePath, this.compressed, tableRowsFileDest);

        try {
            await tableRowsFileSrc.loadCorrupted();
        } catch (e) {
            console.error(e);
        }
        try {
            await reducerDest._load(true, `${this.tablePath}/meta.0`);
        } catch (e) {
            console.error(e);
        }

        const putRows = async(rows) => {
            const oldRows = [];
            const newRows = [];
            const newRowsStr = [];
            //checks
            for (const row of rows) {                
                if (!row) {
                    continue;
                }

                const t = typeof(row.id);
                if  (t !== 'number' && t !== 'string') {
                    continue;
                }

                const oldRow = await tableRowsFileDest.getRow(row.id);

                if (oldRow) {
                    continue;
                }

                let str = '';
                try {
                    str = JSON.stringify(row);//because of stringify errors
                } catch(e) {
                    continue;
                }

                newRows.push(row);
                oldRows.push({});
                newRowsStr.push(str);
            }

            try {
                //reducer
                reducerDest._update(oldRows, newRows, 1);

                //insert
                for (let i = 0; i < newRows.length; i++) {
                    const newRow = newRows[i];
                    const newRowStr = newRowsStr[i];

                    tableRowsFileDest.setRow(newRow.id, newRow, newRowStr, 1);
                }

                await tableRowsFileDest.saveDelta(1);
                await reducerDest._saveDelta(1);
            } catch(e) {
                console.error(e);
            }
        };

        let rows = [];
        for (const id of tableRowsFileSrc.getAllIds()) {
            if (this.closed)
                throw new Error('Table closed');

            let row = null;
            try {
                row = await tableRowsFileSrc.getRow(id);
            } catch(e) {
                console.error(e);
                continue;
            }

            rows.push(row);
            if (rows.length > 1000) {
                await putRows(rows);
                rows = [];
            }
        }
        if (rows.length)
            await putRows(rows);

        await tableRowsFileDest.saveDelta(0);

        const delta = reducerDest._getDelta(0);
        delta.dumpMeta = true;
        await reducerDest._saveDelta(0);

        await tableRowsFileSrc.destroy();
        await reducerDest._destroy();
        await tableRowsFileDest.destroy();        

        await fs.writeFile(`${tempTablePath}/state`, '1');

        await fs.rmdir(this.tablePath, { recursive: true });
        await fs.rename(tempTablePath, this.tablePath);
    }

    /*
    query: {
        tablePath: String,
        inMemory: Boolean,
        cacheSize: Number,
        compressed: Number, 0..9
        recreate: Boolean, false,
        autoRepair: Boolean, false,
        forceFileClosing: Boolean, false,
        lazyOpen: Boolean, false,
    }
    */
    async _open(query = {}) {
        if (this.opening)
            return;
        this.opening = true;
        await this.openingLock.get();
        //console.log(query);
        try {
            if (this.opened)
                throw new Error('Table has already been opened');
            if (this.closed)
                throw new Error('Table instance has been destroyed. Please create a new one.');

            this.inMemory = !!query.inMemory;

            if (this.inMemory) {
                this.reducer = new TableReducer(this.inMemory, '', 0, this.rowsInterface);
            } else {
                if (!query.tablePath)
                    throw new Error(`'query.tablePath' parameter is required`);

                this.tablePath = query.tablePath;
                this.cacheSize = query.cacheSize || 5;
                this.compressed = query.compressed || 0;
                this.recreate = query.recreate || false;
                this.autoRepair = query.autoRepair || false;
                this.forceFileClosing = query.forceFileClosing || false;

                await fs.mkdir(this.tablePath, { recursive: true });

                this.tableRowsFile = new TableRowsFile(query.tablePath, this.cacheSize, this.compressed);
                this.rowsInterface = this.tableRowsFile;

                this.reducer = new TableReducer(this.inMemory, this.tablePath, this.compressed, this.rowsInterface);

                const statePath = `${this.tablePath}/state`;
                let state = null;
                if (await utils.pathExists(statePath)) {
                    state = await fs.readFile(statePath, 'utf8');
                }

                if (state === null) {//check if other files exists
                    const files = await fs.readdir(this.tablePath);
                    if (files.length)
                        state = '0';
                }

                if (this.recreate) {
                    await this.recreateTable();
                    state = '1';
                }

                if (state !== null) {
                    try {
                        if (state === '1') {
                            // load tableRowsFile & reducer
                            this.autoIncrement = await this.tableRowsFile.load();
                            await this.reducer._load();
                        } else {
                            throw new Error('Table corrupted')
                        }
                    } catch(e) {
                        if (this.autoRepair) {
                            console.error(e.message);
                            await this.recreateTable();
                        } else {
                            throw e;
                        }
                        // load tableRowsFile & reducer
                        this.autoIncrement = await this.tableRowsFile.load();
                        await this.reducer._load();
                    }
                }
            }

            this.opened = true;
        } catch(e) {
            await this.close();
            const errMes = `Open table (${query.tablePath}): ${e.message}`;
            if (!query.lazyOpen)
                throw new Error(errMes);
            else
                this.fileError = errMes;
        } finally {
            this.openingLock.ret();
            this.opening = false;
        }
    }

    async open(query = {}) {
        if (query.lazyOpen) {
            this._open(query);
        } else {
            await this._open(query);
        }
    }    

    async close() {
        if (this.closed)
            return;

        this.opened = false;
        this.closed = true;

        if (!this.inMemory) {
            while (this.savingChanges) {
                await utils.sleep(10);
            }
        }

        //for GC
        if (this.reducer)
            await this.reducer._destroy();
        this.reducer = null;

        if (this.rowsInterface)
            await this.rowsInterface.destroy();
        this.rowsInterface = null;
        this.tableRowsFile = null;
    }

    /*
    query = {
        quietIfExists: Boolean,
        flag:  Object || Array, {name: 'flag1', check: '(r) => r.id > 10'}
        hash:  Object || Array, {field: 'field1', type: 'string', depth: 11, allowUndef: false}
        index: Object || Array, {field: 'field1', type: 'string', depth: 11, allowUndef: false}
    }
    result = {}
    */
    async create(query) {
        await this.openingLock.get(false);
        this.checkErrors();

        await this.lock.get();
        try {
            this.deltaStep++;
            try {
                if (query.flag) {
                    for (const flag of utils.paramToArray(query.flag)) {
                        await this.reducer._addFlag(flag, query.quietIfExists, this.deltaStep);
                    }
                }

                if (query.hash) {
                    for (const hash of utils.paramToArray(query.hash)) {
                        await this.reducer._addHash(hash, query.quietIfExists, this.deltaStep);
                    }
                }

                if (query.index) {
                    for (const index of utils.paramToArray(query.index)) {
                        await this.reducer._addIndex(index, query.quietIfExists, this.deltaStep);
                    }
                }

                this.changes.push([this.deltaStep, 1]);
            } catch(e) {
                this.changes.push([this.deltaStep, 0]);
                throw e;
            }

            return {};
        } finally {
            this.saveChanges();//no await
            this.lock.ret();
        }
    }

    /*
    query = {
        flag:  Object || Array, {name: 'flag1'}
        hash:  Object || Array, {field: 'field1'}
        index: Object || Array, {field: 'field1'}
    }
    result = {}
    */
    async drop(query) {
        await this.openingLock.get(false);
        this.checkErrors();

        await this.lock.get();
        try {
            this.deltaStep++;
            try {
                if (query.flag) {
                    for (const flag of utils.paramToArray(query.flag)) {
                        await this.reducer._delFlag(flag.name, this.deltaStep);
                    }
                }

                if (query.hash) {
                    for (const hash of utils.paramToArray(query.hash)) {
                        await this.reducer._delHash(hash.field, this.deltaStep);
                    }
                }

                if (query.index) {
                    for (const index of utils.paramToArray(query.index)) {
                        await this.reducer._delIndex(index.field, this.deltaStep);
                    }
                }

                this.changes.push([this.deltaStep, 1]);
            } catch(e) {
                this.changes.push([this.deltaStep, 0]);
                throw e;
            }

            return {};
        } finally {
            this.saveChanges();//no await
            this.lock.ret();
        }
    }

    /*
    result = {
        inMemory: Boolean,
        flag:  Array, [{name: 'flag1', check: '(r) => r.id > 10'}, ...]
        hash:  Array, [{field: 'field1', type: 'string', depth: 11, allowUndef: false}, ...]
        index: Array, [{field: 'field1', type: 'string', depth: 11, allowUndef: false}, ...]
    }
    */
    async getMeta() {
        this.checkErrors();

        return {
            inMemory: this.inMemory,
            flag: this.reducer._listFlag(),
            hash: this.reducer._listHash(),
            index: this.reducer._listIndex(),
        };
    }

    prepareWhere(where) {
        if (typeof(where) !== 'string')
            throw new Error('query.where must be a string');

        return `async(__tr) => {${where.replace(/@@/g, 'return await __tr.').replace(/@/g, 'await __tr.')}}`;
    }

    /*
    query = {
        distinct: 'fieldName' || Array,
        count: Boolean,
        map: '(r) => ({id1: r.id, ...})',
        where: `@@index('field1', 10, 20)`,
        sort: '(a, b) => a.id - b.id',
        limit: 10,
        offset: 10,
    }
    result = Array
    */
    async select(query = {}) {
        await this.openingLock.get(false);
        this.checkErrors();

        let ids;//iterator
        if (query.where) {
            const where = this.prepareWhere(query.where);
            const whereFunc = new Function(`return ${where}`)();

            ids = await whereFunc(this.reducer);
        } else {
            ids = this.rowsInterface.getAllIds();
        }

        let found = [];

        let distinct = () => true;
        if (query.distinct) {
            const distFields = (Array.isArray(query.distinct) ? query.distinct : [query.distinct]);
            const dist = new Map();
            distinct = (row) => {
                let uniq = '';
                for (const field of distFields) {
                    const value = row[field];
                    uniq += `${(value === undefined ? '___' : '')}${field}:${value}`;
                }

                if (dist.has(uniq))
                    return false;
                dist.set(uniq, true);
                return true;
            };
        }

        if (!query.where && !query.distinct && query.count) {//some optimization
            found = [{count: this.rowsInterface.getAllIdsSize()}];
        } else {//full running
            for (const id of ids) {
                const row = await this.rowsInterface.getRow(id);

                if (row && distinct(row)) {
                    found.push(row);
                }
            }

            if (query.count) {
                found = [{count: found.length}];
            }
        }

        let result = [];
        if (query.map) {
            const mapFunc = new Function(`return ${query.map}`)();

            for (const row of found) {
                result.push(mapFunc(row));
            }
        } else {
            result = found;
        }

        if (query.sort) {
            const sortFunc = new Function(`return ${query.sort}`)();
            result.sort(sortFunc);
        }

        if (query.hasOwnProperty('limit') || query.hasOwnProperty('offset')) {
            const offset = query.offset || 0;
            const limit = (query.hasOwnProperty('limit') ? query.limit : result.length);
            result = result.slice(offset, offset + limit);
        }

        return utils.cloneDeep(result);
    }

    /*
    query = {
        replace: Boolean,
    (!) rows: Array,
    }
    result = {
    (!) inserted: Number,
    (!) replaced: Number,
    }
    */
    async insert(query = {}) {
        await this.openingLock.get(false);
        this.checkErrors();

        await this.lock.get();
        try {
            if (!Array.isArray(query.rows)) {
                throw new Error('query.rows must be an array');
            }

            const newRows = utils.cloneDeep(query.rows);
            const replace = query.replace;

            //autoIncrement correction
            for (const newRow of newRows) {
                if (typeof(newRow.id) === 'number' && newRow.id >= this.autoIncrement)
                    this.autoIncrement = newRow.id + 1;
            }

            const oldRows = [];
            const newRowsStr = [];
            //checks
            for (const newRow of newRows) {
                if (newRow.hasOwnProperty('___meta'))
                    throw new Error(`Use of field with name '___meta' is forbidden`);

                if (newRow.id === undefined) {
                    newRow.id = this.autoIncrement;
                    this.autoIncrement++;
                }

                const t = typeof(newRow.id);
                if  (t !== 'number' && t !== 'string') {
                    throw new Error(`Row id bad type, 'number' or 'string' expected, got ${t}`);
                }

                const oldRow = await this.rowsInterface.getRow(newRow.id);

                if (!replace && oldRow) {
                    throw new Error(`Record id:${newRow.id} already exists`);
                }

                oldRows.push((oldRow ? oldRow : {}));
                newRowsStr.push(JSON.stringify(newRow));//because of stringify errors
            }

            const result = {inserted: 0, replaced: 0};
            this.deltaStep++;
            try {
                //reducer
                this.reducer._update(oldRows, newRows, this.deltaStep);

                //insert
                for (let i = 0; i < newRows.length; i++) {
                    const newRow = newRows[i];
                    const newRowStr = newRowsStr[i];
                    const oldRow = oldRows[i];

                    this.rowsInterface.setRow(newRow.id, newRow, newRowStr, this.deltaStep);

                    if (oldRow.id !== undefined)
                        result.replaced++;
                    else
                        result.inserted++;
                }

                this.changes.push([this.deltaStep, 1]);
            } catch(e) {
                this.changes.push([this.deltaStep, 0]);
                throw e;
            }

            await this.waitForSaveChanges();
            return result;
        } finally {
            this.saveChanges();//no await
            this.lock.ret();
        }
    }

    /*
    query = {
    (!) mod: '(r) => r.count++',
        where: `@@index('field1', 10, 20)`,
        sort: '(a, b) => a.id - b.id',
        limit: 10,
        offset: 10,
    }
    result = {
    (!) updated: Number,
    }
    */
    async update(query = {}) {
        await this.openingLock.get(false);
        this.checkErrors();

        await this.lock.get();
        try {
            if (typeof(query.mod) !== 'string') {
                throw new Error('query.mod must be a string');
            }
            const modFunc = new Function(`return ${query.mod}`)();

            //where
            let ids;//iterator
            if (query.where) {
                const where = this.prepareWhere(query.where);
                const whereFunc = new Function(`return ${where}`)();

                ids = await whereFunc(this.reducer);
            } else {
                ids = this.rowsInterface.getAllIds();
            }

            //oldRows
            let oldRows = [];
            for (const id of ids) {
                const oldRow = await this.rowsInterface.getRow(id);

                if (oldRow) {
                    oldRows.push(oldRow);
                }
            }

            if (query.sort) {
                const sortFunc = new Function(`return ${query.sort}`)();
                oldRows.sort(sortFunc);
            }
            let newRows = utils.cloneDeep(oldRows);

            if (query.hasOwnProperty('limit') || query.hasOwnProperty('offset')) {
                const offset = query.offset || 0;
                const limit = (query.hasOwnProperty('limit') ? query.limit : newRows.length);
                newRows = newRows.slice(offset, offset + limit);
                oldRows = oldRows.slice(offset, offset + limit);
            }

            //mod & checks
            const context = {};
            const newRowsStr = [];
            for (const newRow of newRows) {
                modFunc(newRow, context);

                const t = typeof(newRow.id);
                if  (t !== 'number' && t !== 'string') {
                    throw new Error(`Row id bad type, 'number' or 'string' expected, got ${t}`);
                }

                //autoIncrement correction
                if (t === 'number' && newRow.id >= this.autoIncrement)
                    this.autoIncrement = newRow.id + 1;

                if (newRow.hasOwnProperty('___meta'))
                    throw new Error(`Use of field with name '___meta' is forbidden`);

                newRowsStr.push(JSON.stringify(newRow));//because of stringify errors
            }

            this.deltaStep++;
            const result = {updated: 0};
            try {
                //reducer
                this.reducer._update(oldRows, newRows, this.deltaStep);

                //replace
                for (let i = 0; i < newRows.length; i++) {
                    const newRow = newRows[i];
                    const newRowStr = newRowsStr[i];

                    // oldRow.id === newRow.id always here, so
                    this.rowsInterface.setRow(newRow.id, newRow, newRowStr, this.deltaStep);

                    result.updated++;
                }

                this.changes.push([this.deltaStep, 1]);
            } catch(e) {
                this.changes.push([this.deltaStep, 0]);
                throw e;
            }

            await this.waitForSaveChanges();
            return result;
        } finally {
            this.saveChanges();//no await
            this.lock.ret();
        }
    }

    /*
    query = {
        where: `@@index('field1', 10, 20)`,
        sort: '(a, b) => a.id - b.id',
        limit: 10,
        offset: 10,
    }
    result = {
    (!) deleted: Number,
    }
    */
    async delete(query = {}) {
        await this.openingLock.get(false);
        this.checkErrors();

        await this.lock.get();
        try {
            //where
            let ids;//iterator
            if (query.where) {
                const where = this.prepareWhere(query.where);
                const whereFunc = new Function(`return ${where}`)();

                ids = await whereFunc(this.reducer);
            } else {
                ids = this.rowsInterface.getAllIds();
            }

            //oldRows
            let oldRows = [];
            let newRows = [];
            for (const id of ids) {
                const oldRow = await this.rowsInterface.getRow(id);

                if (oldRow) {
                    oldRows.push(oldRow);
                    newRows.push({});
                }
            }

            if (query.sort) {
                const sortFunc = new Function(`return ${query.sort}`)();
                oldRows.sort(sortFunc);
            }

            if (query.hasOwnProperty('limit') || query.hasOwnProperty('offset')) {
                const offset = query.offset || 0;
                const limit = (query.hasOwnProperty('limit') ? query.limit : newRows.length);
                newRows = newRows.slice(offset, offset + limit);
                oldRows = oldRows.slice(offset, offset + limit);
            }

            this.deltaStep++;
            const result = {deleted: 0};
            try {
                //reducer
                this.reducer._update(oldRows, newRows, this.deltaStep);

                //delete
                for (let i = 0; i < oldRows.length; i++) {
                    const oldRow = oldRows[i];
                        
                    this.rowsInterface.deleteRow(oldRow.id, this.deltaStep);

                    result.deleted++;
                }

                this.changes.push([this.deltaStep, 1]);
            } catch(e) {
                this.changes.push([this.deltaStep, 0]);
                throw e;
            }

            await this.waitForSaveChanges();
            return result;
        } finally {
            this.saveChanges();//no await
            this.lock.ret();
        }
    }

    async saveState(state) {
        await fs.writeFile(`${this.tablePath}/state`, state);
    }

    async saveChanges() {
        this.needSaveChanges = true;
        if (this.savingChanges)
            return;

        if (this.inMemory) {
            this.changes = [];
            return;
        }

        try {
            this.checkErrors();
        } catch(e) {
            return;
        }

        this.savingChanges = true;
        try {            
            await utils.sleep(0);

            while (this.needSaveChanges) {
                this.needSaveChanges = false;

                await this.saveState('0');
                while (this.changes.length) {

                    const len = this.changes.length;
                    let i = 0;
                    while (i < len) {
                        const [deltaStep, isOk] = this.changes[i];
                        i++;

                        if (isOk) {
                            await this.tableRowsFile.saveDelta(deltaStep);
                            await this.reducer._saveDelta(deltaStep);
                        } else {
                            await this.tableRowsFile.cancelDelta(deltaStep);
                            await this.reducer._cancelDelta(deltaStep);
                        }
                    }

                    this.changes = this.changes.slice(i);
                }
                await this.saveState('1');

                if (this.forceFileClosing) {
                    await this.tableRowsFile.closeAllFiles();
                    await this.reducer._closeAllFiles();
                }
            }
        } catch(e) {
            console.error(e.message);
            this.fileError = e.message;
        } finally {
            this.savingChanges = false;
        }
    }

}

module.exports = Table;