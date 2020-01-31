import Vue from 'vue';

import 'quasar/dist/quasar.css';
import VuePlugin from 'quasar/src/vue-plugin.js'

//components
import {QCircularProgress} from 'quasar/src/components/circular-progress';
import {QInput} from 'quasar/src/components/input';

//config
const config = {};

const components = {
    QInput,
    QCircularProgress,
};

//directives
const directives = {};

//plugins
const plugins = {};

//use
Vue.use(VuePlugin, { config, components, directives, plugins });
