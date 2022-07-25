module.exports = {
    up: [
        ['create', {
            table: 'buc',
            index: [
                {field: 'queryTime', type: 'number'},
                {field: 'checkTime', type: 'number'},
            ]
        }],
    ],    
    down: [
        ['drop', {
            table: 'buc'
        }],
    ]
};
