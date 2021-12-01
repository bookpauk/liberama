module.exports = {
    up: [
        //CREATE TABLE storage (id TEXT PRIMARY KEY, rev INTEGER, time INTEGER, data TEXT);
        ['create', {
            table: 'storage',
            hash: {field: 'id', type: 'string', depth: 100}
        }],
    ],    
    down: [
        ['drop', {
            table: 'storage'
        }],
    ]
};
