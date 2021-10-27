import { createApp } from 'vue';

//import router from './router';
import store from './store';
import {Quasar, QuasarOptions} from './quasar';
//import vueSanitize from 'vue-sanitize';

import App from './components/App1.vue';

//Vue.prototype.$isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent);

const app = createApp(App);
//app.use(router);
app.use(store);
app.use(Quasar, QuasarOptions);
//app.use(vueSanitize);

app.mount('#app');
