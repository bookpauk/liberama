import { createStore } from 'vuex';
//import createPersistedState from 'vuex-persistedstate';
import VuexPersistence from 'vuex-persist';

import root from './root.js';
import config from './modules/config';
import reader from './modules/reader';

const debug = process.env.NODE_ENV !== 'production';

const vuexLocal = new VuexPersistence();

export default createStore(Object.assign({}, root, {
    modules: {
        config,
        reader,
    },
    strict: debug,
    plugins: [vuexLocal.plugin]
}));
