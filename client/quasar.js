import Vue from 'vue';

import 'quasar/dist/quasar.css';
import VuePlugin from 'quasar/src/vue-plugin.js'

//components
import {QCircularProgress} from 'quasar/src/components/circular-progress';

const components = {
    QCircularProgress
};

//directives
const directives = {};

//plugins
const plugins = {};

//config
const config = {};

//use
Vue.use(VuePlugin, { config, components, directives, plugins });
