const c = require('./controllers');

function initRoutes(app, connPool, config) {
    const misc = new c.MiscController(connPool, config);

    const routes = [
        ['POST', '/api/config', misc, 'getConfig', {}],
    ];

    for (let route of routes) {
        const [httpMethod, path, controller, handler, options] = route;

        const callback = async function(req, res) {
            try {
                const result = await controller[handler](req, res, options);

                if (result !== false)
                    res.send(result);
            } catch (e) {
                res.status(500).send({error: e.message});
            }
        };

        switch (httpMethod) {
            case 'GET' :
                app.get(path, callback);
                break;
            case 'POST':
                app.post(path, callback);
                break;
            default: 
                throw new Error(`initRoutes error: unknown httpMethod: ${httpMethod}`);
        }
    }
}

module.exports = {
    initRoutes
}
