import Vue from 'vue';

import 'quasar/dist/quasar.css';
import Quasar from 'quasar/src/vue-plugin.js'

//config
const config = {};

//components
//import {QLayout} from 'quasar/src/components/layout';
//import {QPageContainer, QPage} from 'quasar/src/components/page';
//import {QDrawer} from 'quasar/src/components/drawer';

import {QCircularProgress} from 'quasar/src/components/circular-progress';
import {QInput} from 'quasar/src/components/input';
import {QBtn} from 'quasar/src/components/btn';
import {QBtnToggle} from 'quasar/src/components/btn-toggle';
import {QIcon} from 'quasar/src/components/icon';
import {QSlider} from 'quasar/src/components/slider';
//import {QTabs} from 'quasar/src/components/tabs';
//import {QTab} from 'quasar/src/components/tab';
//import {QTabPanels, QTabPanel} from 'quasar/src/components/tab-panels';
import {QSeparator} from 'quasar/src/components/separator';
import {QList, QItem, QItemSection, QItemLabel} from 'quasar/src/components/item';
import {QTooltip} from 'quasar/src/components/tooltip';
      
const components = {
    //QLayout,
    //QPageContainer, QPage,
    //QDrawer,
    
    QCircularProgress,
    QInput,
    QBtn,
    QBtnToggle,
    QIcon,
    QSlider,
    //QTabs,
    //QTab
    //QTabPanels, QTabPanel,
    QSeparator,
    QList, QItem, QItemSection, QItemLabel,
    QTooltip,

};

//directives 
import Ripple from 'quasar/src/directives/Ripple';

const directives = {Ripple};

//plugins
import AppFullscreen from 'quasar/src/plugins/AppFullscreen';

const plugins = {
    AppFullscreen,
};

//use
Vue.use(Quasar, { config, components, directives, plugins });

//icons
//import '@quasar/extras/material-icons/material-icons.css';
import '@quasar/extras/material-icons-outlined/material-icons-outlined.css';
//import '@quasar/extras/fontawesome-v5/fontawesome-v5.css';
//import fontawesomeV5 from 'quasar/icon-set/fontawesome-v5.js'
//Quasar.iconSet.set(fontawesomeV5);
