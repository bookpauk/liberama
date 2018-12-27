const log = require('../core/getLogger').getLog();
const BaseController = require('./BaseController');
const Lazy = require('lazy.js');

class MiscController extends BaseController {
    async getConfig(req, res) {
        if (Array.isArray(req.body.params))
            return Lazy(this.config).pick(req.body.params).toObject();
        //bad request
        res.status(400).send({error: 'params is not an array'});
        return false;
    }

}

module.exports = MiscController;
