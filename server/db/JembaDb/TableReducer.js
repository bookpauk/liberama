const fs = require('fs').promises;
const path = require('path');

const TableIndex = require('./TableIndex');
const TableHash = require('./TableHash');
const TableFlag = require('./TableFlag');

const utils = require('./utils');

const maxFileDumpSize = 2*1024*1024;//bytes

class TableReducer {
    constructor(inMemory, tablePath, compressed, rowsInterface) {
        this._compressed = compressed || 0;
        this._inMemory = inMemory;
        this._tablePath = tablePath;
        this._rowsInterface = rowsInterface;

        this._flag = new Map();
        this._index = new Map();
        this._hash = new Map();

        this._deltas = new Map();
        this._fd = {};//file descriptors
    }

    _getDelta(deltaStep) {
        if (this._inMemory)
            throw new Error('TableReducer: sometinhg wrong');

        if (this._deltas.has(deltaStep)) {
            return this._deltas.get(deltaStep);
        } else {
            const delta = {
                flag: [],
                index: [],
                hash: [],
            };
            this._deltas.set(deltaStep, delta);
            return delta;
        }
    }

    _getFullPath(fileName) {
        return `${this._tablePath}/${fileName}`;
    }

    async _getNotExistingFileName(prefix) {
        let i = 0;
        while (1) {//eslint-disable-line no-constant-condition
            i++;
            const fileName = `${this._tablePath}/${prefix}${i}`;
            if (!await utils.pathExists(fileName + '.0') && !await utils.pathExists(fileName + '.1'))
                return path.basename(fileName);
        }
    }
    
    async _addFlag(opts, quietIfExists, deltaStep) {
        const flagName = opts.name;

        if (!this._flag.has(flagName)) {
            const flag = new TableFlag(opts.check);
            for (const id of this._rowsInterface.getAllIds())
                flag.add(await this._rowsInterface.getRow(id));
                        
            if (this._inMemory) {
                flag.meta = opts;
            } else {
                const fileName = await this._getNotExistingFileName('flag');
                await this._openFd(this._getFullPath(fileName) + '.1');
                flag.meta = Object.assign({}, opts, {fileName});

                const delta = this._getDelta(deltaStep);
                if (!delta.dumpFlag)
                    delta.dumpFlag = new Map();
                delta.dumpFlag.set(flagName, 1);
                delta.dumpMeta = true;
            }

            this._flag.set(flagName, flag);            
        } else {
            if (!quietIfExists)
                throw new Error(`Flag with name '${flagName}' already exists`);
        }
    }

    async _delFlag(flagName, deltaStep) {
        if (this._flag.has(flagName)) {
            if (!this._inMemory) {
                const delta = this._getDelta(deltaStep);
                delta.dumpMeta = true;

                const fileName = this._getFullPath((this._flag.get(flagName)).meta.fileName);
                if (!delta.delFiles)
                    delta.delFiles = [];
                delta.delFiles.push(fileName);
            }

            this._flag.delete(flagName);
        } else {
            throw new Error(`Flag with name '${flagName}' does not exist`);
        }
    }

    _listFlag() {
        const result = [];
        for (const flag of this._flag.values()) {
            result.push(flag.meta);
        }
        return result;
    }

    async _addHash(opts, quietIfExists, deltaStep) {
        const fieldName = opts.field;

        if (!this._hash.has(fieldName)) {
            const hash = new TableHash(opts);
            for (const id of this._rowsInterface.getAllIds()) {
                const row = await this._rowsInterface.getRow(id);
                hash.add(row[fieldName], id);
            }

            if (this._inMemory) {
                hash.meta = opts;
            } else {
                const fileName = await this._getNotExistingFileName('hash');
                await this._openFd(this._getFullPath(fileName) + '.1');
                hash.meta = Object.assign({}, opts, {fileName});

                const delta = this._getDelta(deltaStep);
                if (!delta.dumpHash)
                    delta.dumpHash = new Map();
                delta.dumpHash.set(fieldName, 1);
                delta.dumpMeta = true;
            }

            this._hash.set(fieldName, hash);
        } else {
            if (!quietIfExists)
                throw new Error(`Hash for field '${fieldName}' already exists`);
        }
    }

    async _delHash(fieldName, deltaStep) {
        if (this._hash.has(fieldName)) {
            if (!this._inMemory) {
                const delta = this._getDelta(deltaStep);
                delta.dumpMeta = true;

                const fileName = this._getFullPath((this._hash.get(fieldName)).meta.fileName);
                if (!delta.delFiles)
                    delta.delFiles = [];
                delta.delFiles.push(fileName);
            }

            this._hash.delete(fieldName);
        } else {
            throw new Error(`Hash for field '${fieldName}' does not exist`);
        }
    }

    _listHash() {
        const result = [];
        for (const hash of this._hash.values()) {
            result.push(hash.meta);
        }
        return result;
    }
    
    async _addIndex(opts, quietIfExists, deltaStep) {
        const fieldName = opts.field;

        if (!this._index.has(fieldName)) {
            const index = new TableIndex(opts);
            for (const id of this._rowsInterface.getAllIds()) {
                const row = await this._rowsInterface.getRow(id);
                index.add(row[fieldName], id);
            }
            
            if (this._inMemory) {
                index.meta = opts;
            } else {
                const fileName = await this._getNotExistingFileName('index');
                await this._openFd(this._getFullPath(fileName) + '.1');
                index.meta = Object.assign({}, opts, {fileName});

                const delta = this._getDelta(deltaStep);
                if (!delta.dumpIndex)
                    delta.dumpIndex = new Map();
                delta.dumpIndex.set(fieldName, 1);
                delta.dumpMeta = true;
            }

            this._index.set(fieldName, index);
        } else {
            if (!quietIfExists)
                throw new Error(`Index for field '${fieldName}' already exists`);
        }
    }

    async _delIndex(fieldName, deltaStep) {
        if (this._index.has(fieldName)) {
            if (!this._inMemory) {
                const delta = this._getDelta(deltaStep);
                delta.dumpMeta = true;

                const fileName = this._getFullPath((this._index.get(fieldName)).meta.fileName);
                if (!delta.delFiles)
                    delta.delFiles = [];
                delta.delFiles.push(fileName);
            }

            this._index.delete(fieldName);
        } else {
            throw new Error(`Index for field '${fieldName}' does not exist`);
        }
    }

    _listIndex() {
        const result = [];
        for (const index of this._index.values()) {
            result.push(index.meta);
        }
        return result;
    }
    
    _update(oldRows, newRows, deltaStep) {
        if (!deltaStep && !this._inMemory)
            throw new Error('Something wrong: deltaStep is empty');

        //oldRows & newRows arrays have equal size
        if (oldRows.length != newRows.length)
            throw new Error('Reducer update: old and new array lengths are not equal');

        //consistency
        const oldIds = new Map();
        const newIds = new Map();
        for (let i = 0; i < oldRows.length; i++) {
            const oldRow = oldRows[i];
            const newRow = newRows[i];

            if (oldRow.id !== undefined) {
                if (oldIds.has(oldRow.id)) {
                    throw new Error(`Reducer update: duplicate old_id:${oldRow.id} detected`);
                }
                oldIds.set(oldRow.id, true);
            }

            if (newRow.id !== undefined) {
                if (newIds.has(newRow.id)) {
                    throw new Error(`Reducer update: duplicate new_id:${newRow.id} detected`);
                }
                newIds.set(newRow.id, true);
            }

            if (oldRow.id !== undefined && newRow.id !== undefined && oldRow.id !== newRow.id)
                throw new Error(`Reducer update: old and new id's are not equal (${oldRow.id} !== ${newRow.id})`);
        }

        //update
        try {
            let delta = (this._inMemory ? null : this._getDelta(deltaStep));

            //flags
            for (const [flagName, flag] of this._flag.entries()) {
                const flagDelta = [];
                for (let i = 0; i < oldRows.length; i++) {
                    const oldRow = oldRows[i];
                    const newRow = newRows[i];

                    if (oldRow.id !== undefined) {
                        flag.del(oldRow);
                        flagDelta.push([oldRow.id, 0]);
                    }
                    if (newRow.id !== undefined) {
                        const added = flag.add(newRow);
                        if (added)
                            flagDelta.push([newRow.id, 1]);
                    }
                }

                if (delta && flagDelta.length) {
                    delta.flag.push([flagName, flagDelta]);
                }
            }

            //hashes
            for (const [fieldName, hash] of this._hash.entries()) {
                const hashDelta = [];
                for (let i = 0; i < oldRows.length; i++) {
                    const oldRow = oldRows[i];
                    const newRow = newRows[i];

                    if (oldRow[fieldName] !== newRow[fieldName]) {
                        if (oldRow.id !== undefined) {
                            const value = hash.del(oldRow[fieldName], oldRow.id);
                            hashDelta.push([value, oldRow.id, 0]);
                        } 
                        if (newRow.id !== undefined) {
                            const value = hash.add(newRow[fieldName], newRow.id);
                            hashDelta.push([value, newRow.id, 1]);
                        }
                    }
                }

                if (delta && hashDelta.length) {
                    delta.hash.push([fieldName, hashDelta]);
                }
            }

            //indexes
            for (const [fieldName, index] of this._index.entries()) {
                const indexDelta = [];
                for (let i = 0; i < oldRows.length; i++) {
                    const oldRow = oldRows[i];
                    const newRow = newRows[i];

                    if (oldRow[fieldName] !== newRow[fieldName]) {
                        if (oldRow.id !== undefined) {
                            const value = index.del(oldRow[fieldName], oldRow.id);
                            indexDelta.push([value, oldRow.id, 0]);
                        }
                        if (newRow.id !== undefined) {
                            const value = index.add(newRow[fieldName], newRow.id);
                            indexDelta.push([value, newRow.id, 1]);
                        }
                    }
                }

                if (delta && indexDelta.length) {
                    delta.index.push([fieldName, indexDelta]);
                }
            }
        } catch(e) {
            //rollback

            //flags
            for (const flag of this._flag.values()) {
                for (let i = 0; i < oldRows.length; i++) {
                    const oldRow = oldRows[i];
                    const newRow = newRows[i];

                    if (newRow.id !== undefined) {
                        try { flag.del(newRow); } catch(e) {} // eslint-disable-line no-empty
                    }
                    if (oldRow.id !== undefined) {
                        try { flag.add(oldRow); } catch(e) {} // eslint-disable-line no-empty
                    }
                }
            }

            //hashes
            for (const [fieldName, hash] of this._hash.entries()) {
                for (let i = 0; i < oldRows.length; i++) {
                    const oldRow = oldRows[i];
                    const newRow = newRows[i];

                    if (oldRow[fieldName] !== newRow[fieldName]) {
                        if (newRow.id !== undefined) {
                            try { hash.del(newRow[fieldName], newRow.id); } catch(e) {} // eslint-disable-line no-empty
                        }
                        if (oldRow.id !== undefined) {
                            try { hash.add(oldRow[fieldName], oldRow.id); } catch(e) {} // eslint-disable-line no-empty
                        }
                    }
                }
            }

            //indexes
            for (const [fieldName, index] of this._index.entries()) {
                for (let i = 0; i < oldRows.length; i++) {
                    const oldRow = oldRows[i];
                    const newRow = newRows[i];

                    if (oldRow[fieldName] !== newRow[fieldName]) {
                        if (newRow.id !== undefined) {
                            try { index.del(newRow[fieldName], newRow.id); } catch(e) {} // eslint-disable-line no-empty
                        }
                        if (oldRow.id !== undefined) {
                            try { index.add(oldRow[fieldName], oldRow.id); } catch(e) {} // eslint-disable-line no-empty
                        }
                    }
                }
            }

            throw e;
        }
    }

    async _closeFd(name) {
        if (this._fd[name]) {
            await this._fd[name].close();
            this._fd[name] = null;
        }
    }
    
    async _openFd(name) {
        if (this._fd[name])
            return;

        if (!name) {
            throw new Error('TableReducer: openFd name is empty');
        }

        const exists = await utils.pathExists(name);

        const fd = await fs.open(name, 'a');
        if (!exists) {
            await fd.write('0[');
        }

        this._fd[name] = fd;
    }

    async _dumpMaps(delta) {
        //dump flag
        for (const [flagName, flag] of this._flag.entries()) {
            const fileName = this._getFullPath(flag.meta.fileName);
            const fileName1 = `${fileName}.1`;

            let size = 0;
            if (this._fd[fileName1])
                size = (await this._fd[fileName1].stat()).size;

            if (size > maxFileDumpSize || (delta.dumpFlag && delta.dumpFlag.get(flagName))) {
                const fileName0 = `${fileName}.0`;
                const fileName2 = `${fileName}.2`;
                
                await this._writeFinal(fileName2, JSON.stringify([...flag.flag]));

                await fs.rename(fileName2, fileName0);
                await this._closeFd(fileName1);
                await fs.unlink(fileName1);
            }
        }

        //dump hash
        for (const [fieldName, hash] of this._hash.entries()) {
            const fileName = this._getFullPath(hash.meta.fileName);
            const fileName1 = `${fileName}.1`;

            let size = 0;
            if (this._fd[fileName1])
                size = (await this._fd[fileName1].stat()).size;

            if (size > maxFileDumpSize || (delta.dumpHash && delta.dumpHash.get(fieldName))) {
                const fileName0 = `${fileName}.0`;
                const fileName2 = `${fileName}.2`;
                
                if (hash.unique) {
                    await this._writeFinal(fileName2, JSON.stringify(Array.from(hash.hash)));
                } else {
                    const buf = [];
                    for (const [key, keySet] of hash.hash) {
                        buf.push([key, [...keySet]]);
                    }
                    await this._writeFinal(fileName2, JSON.stringify(buf));
                }

                await fs.rename(fileName2, fileName0);
                await this._closeFd(fileName1);
                await fs.unlink(fileName1);
            }
        }

        //dump index
        for (const [fieldName, index] of this._index.entries()) {
            const fileName = this._getFullPath(index.meta.fileName);
            const fileName1 = `${fileName}.1`;

            let size = 0;
            if (this._fd[fileName1])
                size = (await this._fd[fileName1].stat()).size;

            if (size > maxFileDumpSize || (delta.dumpIndex && delta.dumpIndex.get(fieldName))) {
                const fileName0 = `${fileName}.0`;
                const fileName2 = `${fileName}.2`;
                
                const buf = {hash: [], sorted: index.sorted, delCount: index.delCount};
                if (index.unique) {
                    buf.hash = Array.from(index.hash);
                } else {
                    for (const [key, keySet] of index.hash) {
                        buf.hash.push([key, [...keySet]]);
                    }
                }
                await this._writeFinal(fileName2, JSON.stringify(buf));

                await fs.rename(fileName2, fileName0);
                await this._closeFd(fileName1);
                await fs.unlink(fileName1);
            }
        }
    }

    async _dumpMeta() {        
        const fileName = this._getFullPath('meta');
        const fileName0 = `${fileName}.0`;
        const fileName2 = `${fileName}.2`;

        await this._writeFinal(fileName2, JSON.stringify({
            flag: this._listFlag(),
            hash: this._listHash(),
            index: this._listIndex(),
        }));
        await fs.rename(fileName2, fileName0);
    }
    
    async _saveDelta(deltaStep) {
        //delta
        const delta = this._getDelta(deltaStep);

        //save flag delta
        for (const flagRec of delta.flag) {
            const [flagName, flagDelta] = flagRec;

            const flag = this._flag.get(flagName);
            const fileName = this._getFullPath(flag.meta.fileName) + '.1';

            if (!this._fd[fileName])
                await this._openFd(fileName);

            const buf = [];
            for (const deltaRec of flagDelta) {
                buf.push(JSON.stringify(deltaRec));
            }

            if (buf.length)
                await this._fd[fileName].write(buf.join(',') + ',');
        }

        //save hash delta
        for (const hashRec of delta.hash) {
            const [hashName, hashDelta] = hashRec;

            const hash = this._hash.get(hashName);
            const fileName = this._getFullPath(hash.meta.fileName) + '.1';

            if (!this._fd[fileName])
                await this._openFd(fileName);

            const buf = [];
            for (const deltaRec of hashDelta) {
                buf.push(JSON.stringify(deltaRec));
            }

            if (buf.length)
                await this._fd[fileName].write(buf.join(',') + ',');
        }

        //save index delta
        for (const indexRec of delta.index) {
            const [indexName, indexDelta] = indexRec;

            const index = this._index.get(indexName);
            const fileName = this._getFullPath(index.meta.fileName) + '.1';

            if (!this._fd[fileName])
                await this._openFd(fileName);

            const buf = [];
            for (const deltaRec of indexDelta) {
                buf.push(JSON.stringify(deltaRec));
            }

            if (buf.length)
                await this._fd[fileName].write(buf.join(',') + ',');
        }

        //dumps
        await this._dumpMaps(delta);

        //meta
        if (delta.dumpMeta)
            await this._dumpMeta();

        //del files
        if (delta.delFiles) {
            for (const fileName of delta.delFiles) {
                if (this._fd[fileName])
                    this._closeFd(fileName);

                if (await utils.pathExists(fileName))
                    await fs.unlink(fileName);                
            }
        }

        this._deltas.delete(deltaStep);
    }

    async _cancelDelta(deltaStep) {
        this._deltas.delete(deltaStep);
    }

    async _loadFile(filePath) {
        let buf = await fs.readFile(filePath);
        if (!buf.length)
            throw new Error(`TableReducer: file ${filePath} is empty`);

        const flag = buf[0];
        if (flag === 50) {//flag '2' ~ finalized && compressed
            const packed = Buffer.from(buf.buffer, buf.byteOffset + 1, buf.length - 1);
            const data = await utils.inflate(packed);
            buf = data.toString();
        } else if (flag === 49) {//flag '1' ~ finalized
            buf[0] = 32;//' '
            buf = buf.toString();
        } else {//flag '0' ~ not finalized
            buf[0] = 32;//' '
            const last = buf.length - 1;
            if (buf[last] === 44) {//','
                buf[last] = 93;//']'
                buf = buf.toString();
            } else {//corrupted or empty
                buf = buf.toString();
                if (this._loadCorrupted) {
                    const lastComma = buf.lastIndexOf(',');
                    if (lastComma >= 0)
                        buf = buf.substring(0, lastComma);
                }
                buf += ']';
            }
        }

        let result;
        try {
            result = JSON.parse(buf);
        } catch(e) {
            throw new Error(`load ${filePath} failed: ${e.message}`);
        }

        return result;
    }

    async _writeFinal(fileName, data) {
        if (!this._compressed) {
            await fs.writeFile(fileName, '1' + data);
        } else {
            let buf = Buffer.from(data);
            buf = await utils.deflate(buf, this.compressed);
            const fd = await fs.open(fileName, 'w');
            await fd.write('2');
            await fd.write(buf);
            await fd.close();
        }
    }

    async _load(corrupted = false, metaPath = '') {
        if (corrupted)
            this._loadCorrupted = true;

        const metaFileName = (metaPath ? metaPath : this._getFullPath('meta.0'));
        if (!await utils.pathExists(metaFileName))
            return;

        const meta = await this._loadFile(metaFileName);

        //flag
        this._flag.clear();
        for (const opts of meta.flag) {
            const flag = new TableFlag(opts.check);
            flag.meta = opts;

            if (!corrupted) {
                const fileName = this._getFullPath(opts.fileName);
                const fileName0 = `${fileName}.0`;
                const fileName1 = `${fileName}.1`;

                //load dump
                if (await utils.pathExists(fileName0)) {
                    const data = await this._loadFile(fileName0);
                    flag.flag = new Set(data);
                }

                //load delta
                if (await utils.pathExists(fileName1)) {
                    const flagDelta = await this._loadFile(fileName1);
                    for (const deltaRec of flagDelta) {
                        const [id, isAdd] = deltaRec;
                        if (isAdd)
                            flag.flag.add(id);
                        else
                            flag.flag.delete(id);
                    }
                }
            }

            this._flag.set(opts.name, flag);            
        }

        //hash
        this._hash.clear();
        for (const opts of meta.hash) {
            const hash = new TableHash(opts);
            hash.meta = opts;

            if (!corrupted) {
                const fileName = this._getFullPath(opts.fileName);
                const fileName0 = `${fileName}.0`;
                const fileName1 = `${fileName}.1`;

                //load dump
                if (await utils.pathExists(fileName0)) {
                    const data = await this._loadFile(fileName0);
                    if (hash.unique) {
                        hash.hash = new Map(data);
                    } else {
                        for (const rec of data) {
                            const [key, keySet] = rec;
                            hash.hash.set(key, new Set(keySet));
                        }
                    }
                }

                //load delta
                if (await utils.pathExists(fileName1)) {
                    const hashDelta = await this._loadFile(fileName1);
                    for (const deltaRec of hashDelta) {
                        const [value, id, isAdd] = deltaRec;
                        if (isAdd)
                            hash.add(value, id);
                        else
                            hash.del(value, id);
                    }
                }
            }

            this._hash.set(opts.field, hash);            
        }

        //index
        this._index.clear();
        for (const opts of meta.index) {
            const index = new TableIndex(opts);
            index.meta = opts;

            if (!corrupted) {
                const fileName = this._getFullPath(opts.fileName);
                const fileName0 = `${fileName}.0`;
                const fileName1 = `${fileName}.1`;

                //load dump
                if (await utils.pathExists(fileName0)) {
                    const data = await this._loadFile(fileName0);
                    index.sorted = data.sorted;
                    index.delCount = data.delCount;

                    if (index.unique) {
                        index.hash = new Map(data.hash);
                    } else {
                        for (const rec of data.hash) {
                            const [key, keySet] = rec;
                            index.hash.set(key, new Set(keySet));
                        }
                    }
                }

                //load delta
                if (await utils.pathExists(fileName1)) {
                    const indexDelta = await this._loadFile(fileName1);
                    for (const deltaRec of indexDelta) {
                        const [value, id, isAdd] = deltaRec;
                        if (isAdd)
                            index.add(value, id);
                        else
                            index.del(value, id);
                    }
                }
            }

            this._index.set(opts.field, index);            
        }
    }

    async _closeAllFiles() {
        for (const name of Object.keys(this._fd)) {
            await this._closeFd(name);
        }
    }

    async _destroy() {
        await this._closeAllFiles();

        //for GC
        this._flag.clear();
        this._index.clear();
        this._hash.clear();
        this._deltas.clear();
        this._rowsInterface = null;
    }

    //------------------------------------------------------------------------------------------
    //Reducer methods
    async id() {
        const result = new Set();
        for (const arg of arguments) {
            if (!Array.isArray(arg))
                result.add(arg);
            else {
                for (const id of arg) {
                    result.add(id);
                }
            }
        }
        return result;
    }

    async flag(flagName) {
        if (this._flag.has(flagName)) {
            return new Set(this._flag.get(flagName).flag);
        } else {
            throw new Error(`Flag with name '${flagName}' does not exist`);
        }
    }

    async hash(fieldName, value) {
        if (this._hash.has(fieldName)) {
            const hash = this._hash.get(fieldName);

            const result = new Set();
            if (!Array.isArray(value)) {
                const ids = hash.reduce(value);
                for (const id of ids) {
                    const row = await this._rowsInterface.getRow(id);
                    if (row[fieldName] === value)
                        result.add(id);
                }
            } else {
                for (const v of value) {
                    const ids = hash.reduce(v);
                    for (const id of ids) {
                        const row = await this._rowsInterface.getRow(id);
                        if (row[fieldName] === v)
                            result.add(id);
                    }
                }
            }

            return result;
        } else {
            throw new Error(`Hash for field '${fieldName}' does not exist`);
        }
    }

    async hashMin(fieldName) {
        if (this._hash.has(fieldName)) {
            const hash = this._hash.get(fieldName);
            return hash.min();
        } else {
            throw new Error(`Hash for field '${fieldName}' does not exist`);
        }
    }

    async hashMax(fieldName) {
        if (this._hash.has(fieldName)) {
            const hash = this._hash.get(fieldName);
            return hash.max();
        } else {
            throw new Error(`Hash for field '${fieldName}' does not exist`);
        }
    }

    async hashIter(fieldName, checkFunc) {
        if (this._hash.has(fieldName)) {
            const hash = this._hash.get(fieldName);
            return hash.iter(checkFunc);
        } else {
            throw new Error(`Hash for field '${fieldName}' does not exist`);
        }
    }    

    async _indexReduce(fieldName, from, to, checkFuncs) {
        if (this._index.has(fieldName)) {
            const index = this._index.get(fieldName);
            const ids = index.reduce(from, to);

            const check = (index.isNumber ? checkFuncs[0] : checkFuncs[1]);
            const result = new Set();
            for (const id of ids) {
                const row = await this._rowsInterface.getRow(id);
                if (check(row[fieldName]))
                    result.add(id);
            }
            return result;
        } else {
            throw new Error(`Index for field '${fieldName}' does not exist`);
        }
    }

    async index(fieldName, from, to) {
        let checkFuncs = [
            (value) => (value > from && value < to),
            (value) => (value.localeCompare(from) > 0 && value.localeCompare(to) < 0),
        ];
        if (from === undefined) {
            checkFuncs = [
                (value) => (value < to),
                (value) => (value.localeCompare(to) < 0),
            ];
        } else if (to === undefined) {
            checkFuncs = [
                (value) => (value > from),
                (value) => (value.localeCompare(from) > 0),
            ];
        }
        return this._indexReduce(fieldName, from, to, checkFuncs);
    }

    async indexL(fieldName, from, to) {
        let checkFuncs = [
            (value) => (value >= from && value < to),
            (value) => (value.localeCompare(from) >= 0 && value.localeCompare(to) < 0),
        ];
        if (from === undefined) {
            checkFuncs = [
                (value) => (value < to),
                (value) => (value.localeCompare(to) < 0),
            ];
        } else if (to === undefined) {
            checkFuncs = [
                (value) => (value >= from),
                (value) => (value.localeCompare(from) >= 0),
            ];
        }
        return this._indexReduce(fieldName, from, to, checkFuncs);
    }

    async indexR(fieldName, from, to) {
        let checkFuncs = [
            (value) => (value > from && value <= to),
            (value) => (value.localeCompare(from) > 0 && value.localeCompare(to) <= 0),
        ];
        if (from === undefined) {
            checkFuncs = [
                (value) => (value <= to),
                (value) => (value.localeCompare(to) <= 0),
            ];
        } else if (to === undefined) {
            checkFuncs = [
                (value) => (value > from),
                (value) => (value.localeCompare(from) > 0),
            ];
        }
        return this._indexReduce(fieldName, from, to, checkFuncs);
    }

    async indexLR(fieldName, from, to) {
        let checkFuncs = [
            (value) => (value >= from && value <= to),
            (value) => (value.localeCompare(from) >= 0 && value.localeCompare(to) <= 0),
        ];
        if (from === undefined) {
            checkFuncs = [
                (value) => (value <= to),
                (value) => (value.localeCompare(to) <= 0),
            ];
        } else if (to === undefined) {
            checkFuncs = [
                (value) => (value >= from),
                (value) => (value.localeCompare(from) >= 0),
            ];
        }
        return this._indexReduce(fieldName, from, to, checkFuncs);
    }

    async indexMin(fieldName) {
        if (this._index.has(fieldName)) {
            const index = this._index.get(fieldName);
            return index.min();
        } else {
            throw new Error(`Index for field '${fieldName}' does not exist`);
        }
    }

    async indexMax(fieldName) {
        if (this._index.has(fieldName)) {
            const index = this._index.get(fieldName);
            return index.max();
        } else {
            throw new Error(`Index for field '${fieldName}' does not exist`);
        }
    }

    async indexIter(fieldName, checkFunc) {
        if (this._index.has(fieldName)) {
            const index = this._index.get(fieldName);
            return index.iter(checkFunc);
        } else {
            throw new Error(`Index for field '${fieldName}' does not exist`);
        }
    }

    //returns iterator, not Set
    async all() {
        return this._rowsInterface.getAllIds();
    }

    async allSize() {
        return this._rowsInterface.getAllIdsSize();
    }

    async iter(ids, checkFunc) {
        const result = new Set();
        for (const id of ids) {
            const row = await this._rowsInterface.getRow(id);
            const checkResult = checkFunc(row);
            if (checkResult === undefined)
                break;
            if (checkResult)
                result.add(id);
        }
        return result;
    }

    async and() {
        const result = [];
        for (const arg of arguments) {
            if (!Array.isArray(arg)) {
                result.push(arg);
            } else {
                for (const s of arg) {
                    result.push(s);
                }
            }
        }
        return utils.intersectSet(result);
    }

    async or() {
        const result = [];
        for (const arg of arguments) {
            if (!Array.isArray(arg))
                result.push(arg);
            else {
                for (const s of arg) {
                    result.push(s);
                }
            }
        }
        return utils.unionSet(result);
    }
}

module.exports = TableReducer;