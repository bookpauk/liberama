class TableHash {
    //opts.type = 'string' || 'number' || 'number_as_string'
    constructor(opts = {}) {
        const type = opts.type || 'string';
        this.depth = opts.depth || 11;
        this.allowUndef = opts.allowUndef || false;
        this.unique = opts.unique || false;

        this.hash = new Map();

        this.isNumber = (type === 'number' || type === 'number_as_string');
        this.numberAsString = (type === 'number_as_string');
        this.valueAsString = !this.isNumber || this.numberAsString;
    }

    checkType(v) {
        if (typeof(v) != 'number' && this.isNumber)
            throw new Error(`Hashed value must be a number, got type:${typeof(v)}, value:${v}`);

        if (typeof(v) != 'string' && !this.isNumber)
            throw new Error(`Hashed value must be a string, got type:${typeof(v)}, value:${v}`);
    }

    prepareValue(v) {
        let result = v;
        if (this.numberAsString) {
            result = v.toString().padStart(this.depth, '0');
        }
        if (this.valueAsString && result.length > this.depth)
            result = result.substring(0, this.depth);
        return result;
    }

    add(value, id) {
        if (value === undefined && this.allowUndef)
            return;

        this.checkType(value);

        value = this.prepareValue(value);
        if (this.hash.has(value)) {
            if (this.unique) {
                const id_ = this.hash.get(value);
                if (id_ !== id) {
                    throw new Error(`Collision for unique hash detected: value:${value}, id1:${id_}, id2:${id}`);
                }
            } else {
                const ids = this.hash.get(value);
                ids.add(id);
            }
        } else {
            if (this.unique) {
                this.hash.set(value, id);
            } else {
                const ids = new Set();
                this.hash.set(value, ids);
                ids.add(id);
            }
        }

        return value;
    }

    del(value, id) {
        if (value === undefined && this.allowUndef)
            return;

        this.checkType(value);

        value = this.prepareValue(value);
        if (this.hash.has(value)) {
            if (this.unique) {
                const id_ = this.hash.get(value);
                if (id_ === id)
                    this.hash.delete(value);
            } else {
                const ids = this.hash.get(value);

                ids.delete(id);

                if (!ids.size) {
                    this.hash.delete(value);
                }
            }
        }

        return value;
    }

    reduce(value) {
        this.checkType(value);

        value = this.prepareValue(value);
        let result;
        if (this.hash.has(value)) {
            if (this.unique) {
                result = new Set();
                result.add(this.hash.get(value));
            } else {
                result = this.hash.get(value);
            }
        } else {
            result = new Set();
        }

        return result;
    }

    min() {
        let result = new Set();

        let min = null;
        let id = null;
        for (const value of this.hash.keys()) {
            if (value < min || min === null) {
                min = value;
                id = this.hash.get(min);
            }
        }

        if (id !== null) {
            if (this.unique)
                result.add(id);
            else
                result = id;
        }

        return result;
    }

    max() {
        let result = new Set();

        let max = null;
        let id = null;
        for (const value of this.hash.keys()) {
            if (value > max || max === null) {
                max = value;
                id = this.hash.get(max);
            }
        }

        if (id !== null) {
            if (this.unique)
                result.add(id);
            else
                result = id;
        }

        return result;
    }

    iter(checkFunc) {
        const result = new Set();
        for (const [value, ids] of this.hash.entries()) {
            const checkResult = checkFunc(value);
            if (checkResult === undefined)
                break;
            if (checkResult) {
                if (this.unique) {
                    result.add(ids);
                } else {
                    for (const id of ids)
                        result.add(id);
                }
            }
        }
        return result;
    }
}

module.exports = TableHash;