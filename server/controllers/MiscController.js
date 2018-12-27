const log = require('../core/getLogger').getLog();
const BaseController = require('./BaseController');
const Lazy = require('lazy.js');

class MiscController extends BaseController {
    async configValue(req) {
        return Lazy(this.config).pick([req.params.name]).toObject();
    }
}

module.exports = MiscController;
