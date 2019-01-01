import Vue from 'vue';
import Vuex from 'vuex';
import uistate from './modules/uistate';

Vue.use(Vuex);

const debug = process.env.NODE_ENV !== 'production';

export default new Vuex.Store({
  modules: {
    uistate
  },
  strict: debug
});
