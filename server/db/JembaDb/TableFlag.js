class TableFlag {
    constructor(checkCode) {
        this.checkCode = checkCode;
        this.checkFunc = eval(checkCode);

        this.flag = new Set();
    }

    add(row) {
        if (this.checkFunc(row)) {
            this.flag.add(row.id);
            return true;
        }
        return false;
    }

    del(row) {
        this.flag.delete(row.id);
    }
}

module.exports = TableFlag;