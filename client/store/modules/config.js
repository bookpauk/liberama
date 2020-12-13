import miscApi from '../../api/misc';
// initial state
const state = {
    name: null,
    version: null,
    mode: null,
};

// getters
const getters = {};

// actions
const actions = {};

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
