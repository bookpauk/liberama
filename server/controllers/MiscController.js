const BaseController = require('./BaseController');
const _ = require('lodash');

class MiscController extends BaseController {
    async getConfig(req, res) {
        if (Array.isArray(req.body.params))
            return _.pick(this.config, req.body.params);
        //bad request
        res.status(400).send({error: 'params is not an array'});
        return false;
    }

}

module.exports = MiscController;
