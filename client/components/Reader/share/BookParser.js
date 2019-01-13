export default class BookParser {
    constructor() {
    }

    async parse(data, callback) {
        this.data = data;
        
        if (callback)
            callback(100);
        return {author: 'Захарова Елена', title: 'Возвращение'};
    }
}