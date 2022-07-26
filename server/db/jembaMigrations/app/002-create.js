module.exports = {
    up: [
        ['create', {
            /*{
                id, // book URL
                queryTime: Number,
                checkTime: Number, // 0 - never checked
                modTime: String,
                size: Number,
                checkSum: String, //sha256
                state: Number, // 0 - not processing, 1 - processing
                error: String,
            }*/
            table: 'buc'
        }],
    ],    
    down: [
        ['drop', {
            table: 'buc'
        }],
    ]
};
