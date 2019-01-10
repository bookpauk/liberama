// initial state
const state = {
    loaderActive: false,
    fullScreenActive: false,
};

// getters
const getters = {};

// actions
const actions = {};

// mutations
const mutations = {
    setLoaderActive(state, value) {
        state.loaderActive = value;
    },
    setFullScreenActive(state, value) {
        state.fullScreenActive = value;
    },
};

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations
};
