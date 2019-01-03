import Vue from 'vue';
import VueRouter from 'vue-router';
import _ from 'lodash';

import App from './components/App.vue';

import CardIndex from './components/CardIndex/CardIndex.vue';
import Search from  './components/CardIndex/Search/Search.vue';
import Card from  './components/CardIndex/Card/Card.vue';
import Book from  './components/CardIndex/Book/Book.vue';
import History from  './components/CardIndex/History/History.vue';

import Reader from './components/Reader/Reader.vue';
//import Forum from './components/Forum/Forum.vue';
import Income from './components/Income/Income.vue';
import Sources from './components/Sources/Sources.vue';
import Settings from './components/Settings/Settings.vue';
import Help from './components/Help/Help.vue';
import NotFound404 from './components/NotFound404/NotFound404.vue';

const myRoutes = [
    ['/', null, null, '/cardindex'],
    ['/cardindex', CardIndex, null, '/cardindex/search' ],
    ['/cardindex~search', Search ],
    ['/cardindex~card', Card ],
    ['/cardindex~card/:authorId', Card ],
    ['/cardindex~book', Book ],
    ['/cardindex~book/:bookId', Book ],
    ['/cardindex~history', History ],

    ['/reader', Reader ],
    ['/income', Income ],
    ['/sources', Sources ],
    ['/settings', Settings ],
    ['/help', Help ],
    ['*', NotFound404 ],
];

let routes = {};

for (let route of myRoutes) {
    const [path, component, name, redirect] = route;
    let cleanRoute = _.pickBy({path, component, name, redirect}, _.identity);
    
    let parts = cleanRoute.path.split('~');
    let f = routes;
    for (let part of parts) {
        const curRoute = _.assign({}, cleanRoute, { path: part });

        if (!f.children)
            f.children = [];
        let r = f.children;

        f = _.find(r, {path: part});
        if (!f) {
            r.push(curRoute);
            f = curRoute;
        }
    }
}
routes = routes.children;

Vue.use(VueRouter);

export default new VueRouter({
    routes
});
