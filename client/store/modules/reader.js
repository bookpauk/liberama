import Vue from 'vue';

// initial state
const state = {
    fullScreenActive: false,
    toolBarActive: true,
    openedBook: {},
};

// getters
const getters = {
    lastOpenedBook: (state) => {
        let max = 0;
        let result = null;
        for (let bookKey in state.openedBook) {
            const book = state.openedBook[bookKey];
            if (book.touchTime > max) {
                max = book.touchTime;
                result = book;
            }
        }
        return result;
    },
};

// actions
const actions = {};

// mutations
const mutations = {
    setFullScreenActive(state, value) {
        state.fullScreenActive = value;
    },
    setToolBarActive(state, value) {
        state.toolBarActive = value;
    },
    setOpenedBook(state, value) {
        Vue.set(state.openedBook, value.key, Object.assign({}, value, {touchTime: Date.now()}));
    },
    delOpenedBook(state, value) {
        Vue.delete(state.openedBook, value.key);
    }
};

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations
};
