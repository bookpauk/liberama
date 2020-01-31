import Vue from 'vue';

import 'quasar/dist/quasar.css';
import Quasar from 'quasar/src/vue-plugin.js'

//components
import {QCircularProgress} from 'quasar/src/components/circular-progress';
import {QInput} from 'quasar/src/components/input';
import {QBtn} from 'quasar/src/components/btn';
import {QIcon} from 'quasar/src/components/icon';

//config
const config = {};

const components = {
    QInput,
    QBtn,
    QIcon,
    QCircularProgress,
};

//directives
const directives = {};

//plugins
const plugins = {};

//use
Vue.use(Quasar, { config, components, directives, plugins });

//icons
import '@quasar/extras/material-icons/material-icons.css';
//import '@quasar/extras/fontawesome-v5/fontawesome-v5.css';
//import fontawesomeV5 from 'quasar/icon-set/fontawesome-v5.js'
//Quasar.iconSet.set(fontawesomeV5);
