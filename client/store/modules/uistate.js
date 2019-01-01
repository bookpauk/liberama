// initial state
const state = {
  asideBarCollapse: false,
};

// getters
const getters = {};

// actions
const actions = {};

// mutations
const mutations = {
  setAsideBarCollapse(state, value) {
    state.asideBarCollapse = value;
  },
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
};
