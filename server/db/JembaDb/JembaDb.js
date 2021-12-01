const fs = require('fs').promises;

const Table = require('./Table');
const utils = require('./utils');

/* API methods:
openDb
closeDb

create
drop

open
openAll
close
closeAll

tableExists
getDbInfo
getDbSize

select
insert
update
delete

esc
*/

class JembaDb {
    constructor() {
        this.opened = false;
    }

    /*
    query = {
        dbPath: String,
        //table open defaults
        inMemory: Boolean, false
        cacheSize: Number, 5
        compressed: Number, {0..9}, 0
        recreate: Boolean, false,
        autoRepair: Boolean, false,
        forceFileClosing: Boolean, false,
        lazyOpen: Boolean, false,
    }
    */
    async openDb(query = {}) {
        if (this.opened)
            throw new Error(`Database ${this.dbPath} has already been opened`);

        if (!query.dbPath)
            throw new Error(`'query.dbPath' parameter is required`);

        this.dbPath = query.dbPath;
        await fs.mkdir(this.dbPath, { recursive: true });

        this.table = new Map();
        this.tableOpenDefaults = {
            inMemory: query.inMemory,
            cacheSize: query.cacheSize,
            compressed: query.compressed,
            recreate: query.recreate,
            autoRepair: query.autoRepair,
            forceFileClosing: query.forceFileClosing,
            lazyOpen: query.lazyOpen,
        };

        this.opened = true;
    }

    async closeDb() {
        if (!this.opened)
            return;
        
        await this.closeAll();
        this.opened = false;

        //console.log('closed');
    }

    checkOpened() {
        if (!this.opened)
            throw new Error('Database closed');
    }

    /*
    query = {
        table: 'tableName',
        quietIfExists: Boolean,
        inMemory: Boolean, false
        cacheSize: Number, 5
        compressed: Number, {0..9}, 0
        recreate: Boolean, false,
        autoRepair: Boolean, false,
        forceFileClosing: Boolean, false,
        lazyOpen: Boolean, false,

        in: 'tableName',
        flag:  Object || Array, {name: 'flag1', check: '(r) => r.id > 10'}
        hash:  Object || Array, {field: 'field1', type: 'string', depth: 11, allowUndef: false}
        index: Object || Array, {field: 'field1', type: 'string', depth: 11, allowUndef: false}
    }
    result = {}
    */
    async create(query = {}) {
        this.checkOpened();

        if ((!query.table && !query.in) || (query.table && query.in))
            throw new Error(`One of 'query.table' or 'query.in' parameters is required, but not both`);

        let table;
        if (query.table) {
            if (await this.tableExists({table: query.table})) {
                if (!query.quietIfExists)
                    throw new Error(`Table '${query.table}' already exists`);

                table = this.table.get(query.table);
            } else {
                table = new Table();
                this.table.set(query.table, table);

                await this.open(query);
            }
        } else {
            if (await this.tableExists({table: query.in})) {
                table = this.table.get(query.in);
            } else {
                throw new Error(`Table '${query.in}' does not exist`);
            }            
        }

        if (query.flag || query.hash || query.index) {
            await table.create({
                quietIfExists: query.quietIfExists,
                flag: query.flag,
                hash: query.hash,
                index: query.index,
            });
        }

        return {};
    }

    /*
    query = {
        table: 'tableName',

        in: 'tableName',
        flag:  Object || Array, {name: 'flag1'}
        hash:  Object || Array, {field: 'field1'}
        index: Object || Array, {field: 'field1'}
    }
    result = {}
    */
    async drop(query = {}) {
        this.checkOpened();

        if ((!query.table && !query.in) || (query.table && query.in))
            throw new Error(`One of 'query.table' or 'query.in' parameters is required, but not both`);

        if (query.table) {
            if (await this.tableExists({table: query.table})) {
                const table = this.table.get(query.table);
                if (table && table.opened) {
                    await table.close();
                }

                const basePath = `${this.dbPath}/${query.table}`;
                await fs.rmdir(basePath, { recursive: true });

                this.table.delete(query.table);
            } else {
                throw new Error(`Table '${query.table}' does not exist`);
            }
        } else {
            if (await this.tableExists({table: query.in})) {
                const table = this.table.get(query.in);

                if (table) {                
                    if (query.flag || query.hash || query.index) {
                        await table.drop({
                            flag: query.flag,
                            hash: query.hash,
                            index: query.index,
                        });
                    }
                } else {
                    throw new Error(`Table '${query.in}' has not been opened yet`);
                }
            } else {
                throw new Error(`Table '${query.in}' does not exist`);
            }            
        }

        return {};
    }

    /*
    query = {
    (!) table: 'tableName',
        inMemory: Boolean, false
        cacheSize: Number, 5
        compressed: Number, {0..9}, 0
        recreate: Boolean, false,
        autoRepair: Boolean, false,
        forceFileClosing: Boolean, false,
        lazyOpen: Boolean, false,
    }
    */
    async open(query = {}) {
        this.checkOpened();

        if (!query.table)
            throw new Error(`'query.table' parameter is required`);

        if (await this.tableExists({table: query.table})) {
            let table = this.table.get(query.table);

            if (!table) {
                table = new Table();
            }

            if (!table.opened) {
                const opts = Object.assign({}, this.tableOpenDefaults, query);
                opts.tablePath = `${this.dbPath}/${query.table}`;                
                await table.open(opts);
            }

            this.table.set(query.table, table);
        } else {
            throw new Error(`Table '${query.table}' does not exist`);
        }
    }


    async _getTableList() {
        const result = [];
        const files = await fs.readdir(this.dbPath, { withFileTypes: true });

        for (const file of files) {
            if (file.isDirectory()) {
                if (file.name.indexOf('___temporary_recreating') >= 0)
                    continue;
                result.push(file.name);
            }
        }

        return result;
    }

    /*
    query = {
        inMemory: Boolean, false
        cacheSize: Number, 5
        compressed: Number, {0..9}, 0
        recreate: Boolean, false,
        autoRepair: Boolean, false,
        forceFileClosing: Boolean, false,
        lazyOpen: Boolean, false,
    }
    */
    async openAll(query = {}) {
        this.checkOpened();

        const tables = await this._getTableList();

        //sequentially
        for (const table of tables) {
            this.checkOpened();
            await this.open(Object.assign({}, query, {table}));
        }

        /*const promises = [];
        for (const table of tables) {
            promises.push(this.open(Object.assign({}, query, {table})));
        }
        await Promise.all(promises);*/
    }

    /*
    query = {
    (!) table: 'tableName',
    }
    */
    async close(query = {}) {
        this.checkOpened();

        if (!query.table)
            throw new Error(`'query.table' parameter is required`);

        if (await this.tableExists({table: query.table})) {
            let table = this.table.get(query.table);

            if (table) {
                await table.close();
            }

            this.table.delete(query.table);
        } else {
            throw new Error(`Table '${query.table}' does not exist`);
        }
    }

    async closeAll() {
        this.checkOpened();

        const promises = [];
        for (const table of this.table.keys()) {
            promises.push(this.close({table}));
        }
        await Promise.all(promises);
    }

    /*
    query = {
    (!) table: 'tableName'
    },
    result = Boolean
    */
    async tableExists(query = {}) {
        this.checkOpened();

        if (!query.table)
            throw new Error(`'query.table' parameter is required`);

        if (this.table.has(query.table))
            return true;

        if (await utils.pathExists(`${this.dbPath}/${query.table}`))
            return true;

        return false;
    }

    /*
    query = {
        table: 'tableName'
    },
    result = {
        dbPath: String,
        tableName1: {opened: Boolean, ...},
        tableName2: {opened: Boolean, ...},
        ...
    }
    */
    async getDbInfo(query = {}) {
        this.checkOpened();

        const tables = await this._getTableList();

        const result = {dbPath: this.dbPath};
        for (const table of tables) {
            if (!query.table || (query.table && table == query.table)) {
                const tableInstance = this.table.get(table);
                if (tableInstance && tableInstance.opened) {
                    result[table] = await tableInstance.getMeta();
                    result[table].opened = true;
                } else {
                    result[table] = {opened: false};
                }
            }
        }
        return result;
    }

    /*
    result = {
        total: Number,
        tables: {
            tableName1: Number,
            tableName2: Number,
            ...
        }
    }
    */
    async getDbSize() {
        this.checkOpened();

        const dirs = await fs.readdir(this.dbPath, { withFileTypes: true });

        const result = {total: 0, tables: {}};
        for (const dir of dirs) {
            if (dir.isDirectory()) {
                const table = dir.name;
                const tablePath = `${this.dbPath}/${table}`;
                const files = await fs.readdir(tablePath, { withFileTypes: true });

                if (!result.tables[table])
                    result.tables[table] = 0;

                for (const file of files) {
                    if (file.isFile()) {
                        let size = 0;
                        try {
                            size = (await fs.stat(`${tablePath}/${file.name}`)).size;
                        } catch(e) {
                            //
                        }
                        result.tables[table] += size;
                        result.total += size;
                    }
                }
            }
        }

        return result;
    }

    /*
    query = {
    (!) table: 'tableName',
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
        this.checkOpened();

        if (!query.table)
            throw new Error(`'query.table' parameter is required`);

        const table = this.table.get(query.table);
        if (table) {
            return await table.select(query);
        } else {
            if (await this.tableExists({table: query.table})) {
                throw new Error(`Table '${query.table}' has not been opened yet`);
            } else {
                throw new Error(`Table '${query.table}' does not exist`);
            }
        }
    }

    /*
    query = {
    (!) table: 'tableName',
        replace: Boolean,
    (!) rows: Array,
    }
    result = {
    (!) inserted: Number,
    (!) replaced: Number,
    }
    */
    async insert(query = {}) {
        this.checkOpened();

        if (!query.table)
            throw new Error(`'query.table' parameter is required`);

        const table = this.table.get(query.table);
        if (table) {
            return await table.insert(query);
        } else {
            if (await this.tableExists({table: query.table})) {
                throw new Error(`Table '${query.table}' has not been opened yet`);
            } else {
                throw new Error(`Table '${query.table}' does not exist`);
            }
        }
    }

    /*
    query = {
    (!) table: 'tableName',
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
        this.checkOpened();

        if (!query.table)
            throw new Error(`'query.table' parameter is required`);

        const table = this.table.get(query.table);
        if (table) {
            return await table.update(query);
        } else {
            if (await this.tableExists({table: query.table})) {
                throw new Error(`Table '${query.table}' has not been opened yet`);
            } else {
                throw new Error(`Table '${query.table}' does not exist`);
            }
        }
    }

    /*
    query = {
    (!) table: 'tableName',
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
        this.checkOpened();

        if (!query.table)
            throw new Error(`'query.table' parameter is required`);

        const table = this.table.get(query.table);
        if (table) {
            return await table.delete(query);
        } else {
            if (await this.tableExists({table: query.table})) {
                throw new Error(`Table '${query.table}' has not been opened yet`);
            } else {
                throw new Error(`Table '${query.table}' does not exist`);
            }
        }
    }

    esc(obj) {
        return utils.esc(obj);
    }
}

module.exports = JembaDb;