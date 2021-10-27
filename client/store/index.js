import { createStore } from 'vuex';
import createPersistedState from 'vuex-persistedstate';

import root from './root.js';
import uistate from './modules/uistate';
import config from './modules/config';
import reader from './modules/reader';

const debug = process.env.NODE_ENV !== 'production';

export default createStore(Object.assign({}, root, {
    modules: {
        uistate,
        config,
        reader,
    },
    strict: debug,
    plugins: [createPersistedState()]
}));
