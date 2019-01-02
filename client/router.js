import Vue from 'vue';
import VueRouter from 'vue-router';
import App from './components/App.vue';

Vue.use(VueRouter);

let routes = [
    { path: '/', component: App },
    { path: '/cardindex', component: App },
];

export default new VueRouter({
    routes
});
