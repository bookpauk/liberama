import Vue from 'vue';
import Vuex from 'vuex';
import createPersistedState from 'vuex-persistedstate';

import root from './root.js';
import uistate from './modules/uistate';
import config from './modules/config';
import reader from './modules/reader';

Vue.use(Vuex);

const debug = process.env.NODE_ENV !== 'production';

export default new Vuex.Store(Object.assign({}, root, {
    modules: {
        uistate,
        config,
        reader,
    },
    strict: debug,
    plugins: [createPersistedState()]
}));
