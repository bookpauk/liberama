const BaseController = require('./BaseController');
const _ = require('lodash');

class MiscController extends BaseController {
    async getConfig(req, res) {
        if (Array.isArray(req.body.params)) {
            const paramsSet = new Set(req.body.params);

            return _.pick(this.config, this.config.webConfigParams.filter(x => paramsSet.has(x)));
        }
        //bad request
        res.status(400).send({error: 'params is not an array'});
        return false;
    }

}

module.exports = MiscController;
