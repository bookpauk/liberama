class TableRowsMem {
    constructor() {
        this.rows = new Map();
    }

    //--- rows interface
    async getRow(id) {
        return this.rows.get(id);
    }

    setRow(id, row) {
        this.rows.set(id, row);
    }

    deleteRow(id) {
        this.rows.delete(id);
    }

    getAllIds() {
        return this.rows.keys();
    }

    getAllIdsSize() {
        return this.rows.size;
    }
    //--- rows interface end

    async destroy() {
        //for GC
        this.rows = null;
    }
}

module.exports = TableRowsMem;