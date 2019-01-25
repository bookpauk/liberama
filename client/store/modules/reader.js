import Vue from 'vue';

// initial state
const state = {
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

function delBook(state, value) {
    Vue.delete(state.openedBook, value.key);
}

function cleanBooks(state) {
    if (Object.keys(state.openedBook).length > 100) {
        let min = Date.now();
        let found = null;
        for (let bookKey in state.openedBook) {
            const book = state.openedBook[bookKey];
            if (book.touchTime < min) {
                min = book.touchTime;
                found = book;
            }
        }

        if (found) {
            delBook(state, found);
            cleanBooks(state);
        }
    }
}

// mutations
const mutations = {
    setToolBarActive(state, value) {
        state.toolBarActive = value;
    },
    setOpenedBook(state, value) {
        Vue.set(state.openedBook, value.key, Object.assign({}, value, {touchTime: Date.now()}));
        cleanBooks(state);
    },
    delOpenedBook(state, value) {
        delBook(state, value);
    }
};

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations
};
