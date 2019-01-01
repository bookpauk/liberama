import miscApi from '../../api/misc';
// initial state
const state = {
    name: null,
    version: null,
};

// getters
const getters = {};

// actions
const actions = {
    async loadConfig({ commit, state }) {
        commit('setApiError', null, { root: true });
        commit('setConfig', {});
        try {
            const config = await miscApi.loadConfig();
            commit('setConfig', config);
        } catch (e) {
            commit('setApiError', e, { root: true });
        }
    },
};

// mutations
const mutations = {
    setConfig(state, value) {
        Object.assign(state, value);
    },
};

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations
};
