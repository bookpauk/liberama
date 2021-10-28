import { createApp } from 'vue';

import router from './router';
import store from './store';
import {Quasar, QuasarOptions} from './quasar';

import App from './components/App.vue';

const app = createApp(App);
app.use(router);
app.use(store);
app.use(Quasar, QuasarOptions);

app.mount('#app');
