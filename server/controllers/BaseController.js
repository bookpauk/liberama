class BaseController {
    constructor(connPool, config) {
        this.connPool = connPool;
        this.config = config;
    }
}

module.exports = BaseController;