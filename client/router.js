import Vue from 'vue';
import VueRouter from 'vue-router';
import _ from 'lodash';

import App from './components/App.vue';
import CardIndex from './components/CardIndex/CardIndex.vue';
import Reader from './components/Reader/Reader.vue';
//import Forum from './components/Forum/Forum.vue';
import Income from './components/Income/Income.vue';
import Sources from './components/Sources/Sources.vue';
import Settings from './components/Settings/Settings.vue';
import Help from './components/Help/Help.vue';
import NotFound404 from './components/NotFound404/NotFound404.vue';

const myRoutes = [
    ['/', null, null, '/cardindex'],
    ['/cardindex', CardIndex ],
    ['/reader', Reader ],
    ['/income', Income ],
    ['/sources', Sources ],
    ['/settings', Settings ],
    ['/help', Help ],
    ['*', NotFound404 ],
];

let routes = [];

for (let route of myRoutes) {
    const [path, component, name, redirect] = route;
    let r = _.pickBy({path, component, name, redirect}, _.identity);
    routes.push(r);
}

Vue.use(VueRouter);

export default new VueRouter({
    routes
});
