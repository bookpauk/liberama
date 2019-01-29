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
    {css: 'https://fonts.googleapis.com/css?family=Alegreya', name: 'Alegreya', fontVertShift: -5},
    {css: 'https://fonts.googleapis.com/css?family=Alegreya+Sans', name: 'Alegreya Sans', fontVertShift: 5},
    {css: 'https://fonts.googleapis.com/css?family=Amatic+SC', name: 'Amatic SC', fontVertShift: 0},

    {css: 'https://fonts.googleapis.com/css?family=Comfortaa', name: 'Comfortaa', fontVertShift: 10},
    {css: 'https://fonts.googleapis.com/css?family=Cuprum', name: 'Cuprum', fontVertShift: 5},

    {css: 'https://fonts.googleapis.com/css?family=EB+Garamond', name: 'EB Garamond', fontVertShift: -5},

    {css: 'https://fonts.googleapis.com/css?family=Fira+Sans', name: 'Fira Sans', fontVertShift: 5},
    {css: 'https://fonts.googleapis.com/css?family=Fira+Sans+Condensed', name: 'Fira Sans Condensed', fontVertShift: 5},

    {css: 'https://fonts.googleapis.com/css?family=Kosugi+Maru', name: 'Kosugi Maru', fontVertShift: 10},

    {css: 'https://fonts.googleapis.com/css?family=Lobster', name: 'Lobster', fontVertShift: 0},
    {css: 'https://fonts.googleapis.com/css?family=Lora', name: 'Lora', fontVertShift: 0},

    {css: 'https://fonts.googleapis.com/css?family=Merriweather', name: 'Merriweather', fontVertShift: 0},
    {css: 'https://fonts.googleapis.com/css?family=Montserrat', name: 'Montserrat', fontVertShift: 0},

    {css: 'https://fonts.googleapis.com/css?family=Noto+Sans', name: 'Noto Sans', fontVertShift: -10},
    {css: 'https://fonts.googleapis.com/css?family=Noto+Serif', name: 'Noto Serif', fontVertShift: -10},
    {css: 'https://fonts.googleapis.com/css?family=Noto+Serif+TC', name: 'Noto Serif TC', fontVertShift: -15},
    
    {css: 'https://fonts.googleapis.com/css?family=Old+Standard+TT', name: 'Old Standard TT', fontVertShift: 15},
    {css: 'https://fonts.googleapis.com/css?family=Open+Sans+Condensed:300', name: 'Open Sans Condensed', fontVertShift: -5},
    {css: 'https://fonts.googleapis.com/css?family=Oswald', name: 'Oswald', fontVertShift: -20},

    {css: 'https://fonts.googleapis.com/css?family=Pacifico', name: 'Pacifico', fontVertShift: -35},
    {css: 'https://fonts.googleapis.com/css?family=Play', name: 'Play', fontVertShift: 5},
    {css: 'https://fonts.googleapis.com/css?family=Playfair+Display', name: 'Playfair Display', fontVertShift: -5},
    {css: 'https://fonts.googleapis.com/css?family=PT+Sans', name: 'PT Sans', fontVertShift: -10},
    {css: 'https://fonts.googleapis.com/css?family=PT+Sans+Caption', name: 'PT Sans Caption', fontVertShift: -10},
    {css: 'https://fonts.googleapis.com/css?family=PT+Sans+Narrow', name: 'PT Sans Narrow', fontVertShift: -10},
    {css: 'https://fonts.googleapis.com/css?family=PT+Serif', name: 'PT Serif', fontVertShift: -10},

    {css: 'https://fonts.googleapis.com/css?family=Roboto+Condensed', name: 'Roboto Condensed', fontVertShift: 0},
    {css: 'https://fonts.googleapis.com/css?family=Roboto+Mono', name: 'Roboto Mono', fontVertShift: -5},
    {css: 'https://fonts.googleapis.com/css?family=Roboto+Slab', name: 'Roboto Slab', fontVertShift: 0},

    {css: 'https://fonts.googleapis.com/css?family=Source+Sans+Pro', name: 'Source Sans Pro', fontVertShift: 0},

    {css: 'https://fonts.googleapis.com/css?family=Ubuntu+Condensed', name: 'Ubuntu Condensed', fontVertShift: -5},
    {css: 'https://fonts.googleapis.com/css?family=Vollkorn', name: 'Vollkorn', fontVertShift: -5},

    {css: 'https://fonts.googleapis.com/css?family=Yanone+Kaffeesatz', name: 'Yanone Kaffeesatz', fontVertShift: 20},
    


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
        lazyParseEnabled: false,
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
