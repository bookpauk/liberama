module.exports = {
    table: 'migration1',
    data: [
        {id: 1, name: 'create', data: require('./001-create')},
        {id: 2, name: 'create', data: require('./002-create')},
    ]
}