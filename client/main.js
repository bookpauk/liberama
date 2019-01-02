import Vue from 'vue';
import App from './components/App.vue';
import ElementUI from 'element-ui';
import './theme/index.css';
import locale from 'element-ui/lib/locale/lang/ru-RU';
import store from './store';

//Vue.config.productionTip = false;

Vue.use(ElementUI, { locale });

new Vue({
    store,
    render: h => h(App),
}).$mount('#app');
