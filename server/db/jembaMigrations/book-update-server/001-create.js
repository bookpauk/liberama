module.exports = {
    up: [
        ['create', {
            table: 'checked',
            index: [
                {field: 'queryTime', type: 'number'},
                {field: 'checkTime', type: 'number'},
            ]
        }],
    ],    
    down: [
        ['drop', {
            table: 'checked'
        }],
    ]
};
