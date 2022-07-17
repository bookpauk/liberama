module.exports = {
    up: [
        ['create', {
            table: 'remote_sent'
        }],
    ],    
    down: [
        ['drop', {
            table: 'remote_sent'
        }],
    ]
};
