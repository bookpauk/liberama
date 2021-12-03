module.exports = {
    up: [
        //CREATE TABLE storage (id TEXT PRIMARY KEY, rev INTEGER, time INTEGER, data TEXT);
        ['create', {
            table: 'storage'
        }],
    ],    
    down: [
        ['drop', {
            table: 'storage'
        }],
    ]
};
