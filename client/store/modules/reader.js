import Vue from 'vue';

const fonts = [
    {name: 'ReaderDefault', label: 'По-умолчанию', fontVertShift: 0},
    {name: 'GEO_1', label: 'BPG Arial', fontVertShift: 10},
    {name: 'Arimo', fontVertShift: 0},
    {name: 'Avrile', fontVertShift: -10},
    {name: 'OpenSans', fontVertShift: -5},
    {name: 'Roboto', fontVertShift: 10},
    {name: 'Rubik', fontVertShift: 0},
];

const webFonts = [
    {css: 'https://fonts.googleapis.com/css?family=Comfortaa', name: 'Comfortaa', fontVertShift: 10},
    {css: 'https://fonts.googleapis.com/css?family=Lobster', name: 'Lobster', fontVertShift: 0},
    {css: 'https://fonts.googleapis.com/css?family=Oswald', name: 'Oswald', fontVertShift: -20},
    {css: 'https://fonts.googleapis.com/css?family=Pacifico', name: 'Pacifico', fontVertShift: -35},
    
];

const settingDefaults = {
        textColor: '#000000',
        backgroundColor: '#EBE2C9',
        fontStyle: '',// 'italic'
        fontWeight: '',// 'bold'
        fontSize: 20,// px
        fontName: 'ReaderDefault',
        webFontName: '',
        fontVertShift: 0,
        textVertShift: -20,

        lineInterval: 3,// px, межстрочный интервал
        textAlignJustify: true,// выравнивание по ширине
        p: 25,// px, отступ параграфа
        indentLR: 15,// px, отступ всего текста слева и справа
        indentTB: 0,// px, отступ всего текста сверху и снизу
        wordWrap: true,//перенос по слогам
        keepLastToFirst: true,// перенос последней строки в первую при листании

        showStatusBar: true,
        statusBarTop: false,// top, bottom
        statusBarHeight: 19,// px
        statusBarColorAlpha: 0.4,

        pageChangeTransition: '',// '' - нет, downShift, rightShift, thaw - протаивание, blink - мерцание
        pageChangeTransitionSpeed: 50, //0-100%

        allowUrlParamBookPos: false,
        fontShifts: {},
};

for (const font of fonts)
    settingDefaults.fontShifts[font.name] = font.fontVertShift;
for (const font of webFonts)
    settingDefaults.fontShifts[font.name] = font.fontVertShift;

// initial state
const state = {
    toolBarActive: true,
    openedBook: {},
    settings: Object.assign({}, settingDefaults),
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
    },
    setSettings(state, value) {
        state.settings = Object.assign({}, state.settings, value);
    }
};

export default {
    fonts,
    webFonts,
    settingDefaults,

    namespaced: true,
    state,
    getters,
    actions,
    mutations
};
