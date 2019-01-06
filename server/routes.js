const c = require('./controllers');

function initRoutes(app, connPool, config) {
    const misc = new c.MiscController(connPool, config);

    //access
    const serverMode = app.serverConfig.mode;
    const [all, normal, site, reader, omnireader] = // eslint-disable-line no-unused-vars
        [serverMode, 'normal', 'site', 'reader', 'omnireader'];

    //routes
    const routes = [
        ['POST', '/api/config', misc.getConfig.bind(misc), [all], {}],
    ];

    //to app
    for (let route of routes) {
        let [httpMethod, path, controller, access, options] = route;
        access = new Set(access);

        let callback = () => {};
        if (access.has(serverMode)) {//allowed
            callback = async function(req, res) {
                try {
                    const result = await controller(req, res, options);

                    if (result !== false)
                        res.send(result);
                } catch (e) {
                    res.status(500).send({error: e.message});
                }
            };
        } else {//forbidden
            callback = async function(req, res) {
                res.status(403);
            };
        }

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
