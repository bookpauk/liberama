import Vue from 'vue';
import VueRouter from 'vue-router';
import App from './components/App.vue';
import CardIndex from './components/CardIndex/CardIndex.vue';
import Reader from './components/Reader/Reader.vue';
//import Forum from './components/Forum/Forum.vue';
import Income from './components/Income/Income.vue';
import Sources from './components/Sources/Sources.vue';
import Settings from './components/Settings/Settings.vue';
import Help from './components/Help/Help.vue';

Vue.use(VueRouter);

let routes = [
    { path: '/', redirect: '/cardindex' },
    { path: '/cardindex', component: CardIndex },
    { path: '/reader', component: Reader },
    { path: '/income', component: Income },
    { path: '/sources', component: Sources },
    { path: '/settings', component: Settings },
    { path: '/help', component: Help },
];

export default new VueRouter({
    routes
});
