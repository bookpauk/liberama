const utils = require('./utils');

class TableIndex {
    //opts.type = 'string' || 'number' || 'number_as_string'
    constructor(opts = {}) {
        const type = opts.type || 'string';
        this.depth = opts.depth || 11;
        this.allowUndef = opts.allowUndef || false;
        this.unique = opts.unique || false;

        this.hash = new Map();
        this.sorted = [[]];
        this.delCount = 0;

        this.isNumber = (type === 'number' || type === 'number_as_string');
        this.numberAsString = (type === 'number_as_string');
        this.valueAsString = !this.isNumber || this.numberAsString;

        this.cmp = (a, b) => a.localeCompare(b);
        if (type === 'number') {
            this.cmp = (a, b) => a - b;
        } else if (type === 'number_as_string') {
            this.cmp = (a, b) => (a < b ? -1 : (a > b ? 1 : 0));
        }
    }

    checkType(v) {
        if (typeof(v) != 'number' && this.isNumber)
            throw new Error(`Indexed value must be a number, got type:${typeof(v)}, value:${v}`);

        if (typeof(v) != 'string' && !this.isNumber)
            throw new Error(`Indexed value must be a string, got type:${typeof(v)}, value:${v}`);
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
                    throw new Error(`Collision for unique index detected: value:${value}, id1:${id_}, id2:${id}`);
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

            let s = this.sorted.length - 1;
            const d = this.sorted[s];
            d.push(value);

            let i = d.length - 1;
            //вставка
            while (i > 0 && this.cmp(d[i], d[i - 1]) < 0) {
                const v = d[i];
                d[i] = d[i - 1];
                d[i - 1] = v;
                i--;
            }

            if (d.length > 10) {
                //слияние
                while (s > 0 && this.sorted[s].length >= this.sorted[s - 1].length) {
                    const a = this.sorted.pop();
                    const b = this.sorted.pop();
                    const c = [];
                    let i = 0;
                    let j = 0;
                    while (i < a.length || j < b.length) {
                        if (i < a.length && (j === b.length || this.cmp(a[i], b[j]) <= 0)) {
                            c.push(a[i]);
                            i++;
                        }
                        if (j < b.length && (i === a.length || this.cmp(b[j], a[i]) <= 0)) {
                            c.push(b[j]);
                            j++;
                        }
                    }
                    this.sorted.push(c);
                    s--;
                }

                this.sorted.push([]);
            }
        }

        return value;
    }

    del(value, id, forceClean = false) {
        if (value === undefined && this.allowUndef)
            return;

        this.checkType(value);

        value = this.prepareValue(value);
        if (this.hash.has(value)) {
            if (this.unique) {
                const id_ = this.hash.get(value);
                if (id_ === id) {
                    this.hash.delete(value);
                    this.delCount++;
                }
            } else {
                const ids = this.hash.get(value);

                ids.delete(id);

                if (!ids.size) {
                    this.hash.delete(value);
                    this.delCount++;
                }
            }
        }

        if (this.delCount > (this.sorted[0].length >> 2) || forceClean) {
            for (let s = 0; s < this.sorted.length; s++) {
                const a = this.sorted[s];
                const b = [];
                for (let i = 0; i < a.length; i++) {
                    if (this.hash.has(a[i]))
                        b.push(a[i]);
                }
                this.sorted[s] = b;
            }
            
            this.sorted = this.sorted.filter(a => a.length);
            if (!this.sorted.length) {
                this.sorted = [[]]
            } else {
                this.sorted.sort((a, b) => b.length - a.length);                
            }

            this.delCount = 0;
        }

        return value;        
    }

    reduce(from, to) {
        const useFrom = (from !== undefined);
        const useTo = (to !== undefined);

        if (useFrom) {
            this.checkType(from);
            from = this.prepareValue(from);
        }
        if (useTo) {
            this.checkType(to);
            to = this.prepareValue(to);
        }

        const result = [];
        for (let s = 0; s < this.sorted.length; s++) {
            const a = this.sorted[s];
            if (!a.length) // на всякий случай
                continue;

            let leftIndex = 0;
            if (useFrom) {
                //дихотомия
                let left = 0;
                let right = a.length - 1;
                while (left < right) {
                    let mid = left + ((right - left) >> 1);
                    if (this.cmp(from, a[mid]) <= 0)
                        right = mid;
                    else
                        left = mid + 1;
                }

                leftIndex = right;
                if (this.cmp(from, a[right]) > 0)
                    leftIndex++;
            }

            let rightIndex = a.length;
            if (useTo) {
                //дихотомия
                let left = 0;
                let right = a.length - 1;
                while (left < right) {
                    let mid = right - ((right - left) >> 1);
                    if (this.cmp(to, a[mid]) >= 0)
                        left = mid;
                    else
                        right = mid - 1;
                }

                rightIndex = left;
                if (this.cmp(to, a[left]) >= 0)
                    rightIndex++;
            }
//console.log(a, leftIndex, rightIndex);
            if (this.unique) {
                const ids = new Set();
                for (let i = leftIndex; i < rightIndex; i++) {
                    const value = a[i];
                    if (this.hash.has(value)) {
                        ids.add(this.hash.get(value));
                    }
                }
                result.push(ids);
            } else {
                for (let i = leftIndex; i < rightIndex; i++) {
                    const value = a[i];
                    if (this.hash.has(value)) {
                        result.push(this.hash.get(value));
                    }
                }
            }
        }

        return utils.unionSet(result);
    }

    min() {
        let result = new Set();

        let min = null;
        let id = null;
        for (let s = 0; s < this.sorted.length; s++) {
            const a = this.sorted[s];
            if (!a.length) // на всякий случай
                continue;
            if (a[0] < min || min === null) {
                min = a[0];
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
        for (let s = 0; s < this.sorted.length; s++) {
            const a = this.sorted[s];
            if (!a.length) // на всякий случай
                continue;

            const last = a.length - 1;
            if (a[last] > max || max === null) {
                max = a[last];
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

module.exports = TableIndex;