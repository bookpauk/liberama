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
    {css: 'https://fonts.googleapis.com/css?family=Alegreya+SC', name: 'Alegreya SC', fontVertShift: -5},
    {css: 'https://fonts.googleapis.com/css?family=Alice', name: 'Alice', fontVertShift: 5},
    {css: 'https://fonts.googleapis.com/css?family=Amatic+SC', name: 'Amatic SC', fontVertShift: 0},
    {css: 'https://fonts.googleapis.com/css?family=Andika', name: 'Andika', fontVertShift: -35},
    {css: 'https://fonts.googleapis.com/css?family=Anonymous+Pro', name: 'Anonymous Pro', fontVertShift: 5},
    {css: 'https://fonts.googleapis.com/css?family=Arsenal', name: 'Arsenal', fontVertShift: 0},

    {css: 'https://fonts.googleapis.com/css?family=Bad+Script', name: 'Bad Script', fontVertShift: -30},

    {css: 'https://fonts.googleapis.com/css?family=Caveat', name: 'Caveat', fontVertShift: -5},
    {css: 'https://fonts.googleapis.com/css?family=Comfortaa', name: 'Comfortaa', fontVertShift: 10},
    {css: 'https://fonts.googleapis.com/css?family=Cormorant', name: 'Cormorant', fontVertShift: 0},
    {css: 'https://fonts.googleapis.com/css?family=Cormorant+Garamond', name: 'Cormorant Garamond', fontVertShift: 0},
    {css: 'https://fonts.googleapis.com/css?family=Cormorant+Infant', name: 'Cormorant Infant', fontVertShift: 5},
    {css: 'https://fonts.googleapis.com/css?family=Cormorant+Unicase', name: 'Cormorant Unicase', fontVertShift: 0},
    {css: 'https://fonts.googleapis.com/css?family=Cousine', name: 'Cousine', fontVertShift: 0},
    {css: 'https://fonts.googleapis.com/css?family=Cuprum', name: 'Cuprum', fontVertShift: 5},

    {css: 'https://fonts.googleapis.com/css?family=Didact+Gothic', name: 'Didact Gothic', fontVertShift: -10},

    {css: 'https://fonts.googleapis.com/css?family=EB+Garamond', name: 'EB Garamond', fontVertShift: -5},
    {css: 'https://fonts.googleapis.com/css?family=El+Messiri', name: 'El Messiri', fontVertShift: -5},

    {css: 'https://fonts.googleapis.com/css?family=Fira+Mono', name: 'Fira Mono', fontVertShift: 5},
    {css: 'https://fonts.googleapis.com/css?family=Fira+Sans', name: 'Fira Sans', fontVertShift: 5},
    {css: 'https://fonts.googleapis.com/css?family=Fira+Sans+Condensed', name: 'Fira Sans Condensed', fontVertShift: 5},
    {css: 'https://fonts.googleapis.com/css?family=Fira+Sans+Extra+Condensed', name: 'Fira Sans Extra Condensed', fontVertShift: 5},
    {css: 'https://fonts.googleapis.com/css?family=Forum', name: 'Forum', fontVertShift: 5},

    {css: 'https://fonts.googleapis.com/css?family=Gabriela', name: 'Gabriela', fontVertShift: 5},

    {css: 'https://fonts.googleapis.com/css?family=IBM+Plex+Mono', name: 'IBM Plex Mono', fontVertShift: -5},
    {css: 'https://fonts.googleapis.com/css?family=IBM+Plex+Sans', name: 'IBM Plex Sans', fontVertShift: -5},
    {css: 'https://fonts.googleapis.com/css?family=IBM+Plex+Serif', name: 'IBM Plex Serif', fontVertShift: -5},
    {css: 'https://fonts.googleapis.com/css?family=Istok+Web', name: 'Istok Web', fontVertShift: -5},

    {css: 'https://fonts.googleapis.com/css?family=Jura', name: 'Jura', fontVertShift: 0},

    {css: 'https://fonts.googleapis.com/css?family=Kelly+Slab', name: 'Kelly Slab', fontVertShift: 0},
    {css: 'https://fonts.googleapis.com/css?family=Kosugi', name: 'Kosugi', fontVertShift: 5},
    {css: 'https://fonts.googleapis.com/css?family=Kosugi+Maru', name: 'Kosugi Maru', fontVertShift: 10},
    {css: 'https://fonts.googleapis.com/css?family=Kurale', name: 'Kurale', fontVertShift: -15},

    {css: 'https://fonts.googleapis.com/css?family=Ledger', name: 'Ledger', fontVertShift: -5},
    {css: 'https://fonts.googleapis.com/css?family=Lobster', name: 'Lobster', fontVertShift: 0},
    {css: 'https://fonts.googleapis.com/css?family=Lora', name: 'Lora', fontVertShift: 0},

    {css: 'https://fonts.googleapis.com/css?family=Marck+Script', name: 'Marck Script', fontVertShift: 0},
    {css: 'https://fonts.googleapis.com/css?family=Marmelad', name: 'Marmelad', fontVertShift: 0},
    {css: 'https://fonts.googleapis.com/css?family=Merriweather', name: 'Merriweather', fontVertShift: 0},
    {css: 'https://fonts.googleapis.com/css?family=Montserrat', name: 'Montserrat', fontVertShift: 0},
    {css: 'https://fonts.googleapis.com/css?family=Montserrat+Alternates', name: 'Montserrat Alternates', fontVertShift: 0},

    {css: 'https://fonts.googleapis.com/css?family=Neucha', name: 'Neucha', fontVertShift: 0},
    {css: 'https://fonts.googleapis.com/css?family=Noto+Sans', name: 'Noto Sans', fontVertShift: -10},
    {css: 'https://fonts.googleapis.com/css?family=Noto+Sans+SC', name: 'Noto Sans SC', fontVertShift: -15},
    {css: 'https://fonts.googleapis.com/css?family=Noto+Serif', name: 'Noto Serif', fontVertShift: -10},
    {css: 'https://fonts.googleapis.com/css?family=Noto+Serif+TC', name: 'Noto Serif TC', fontVertShift: -15},
    
    {css: 'https://fonts.googleapis.com/css?family=Old+Standard+TT', name: 'Old Standard TT', fontVertShift: 15},
    {css: 'https://fonts.googleapis.com/css?family=Open+Sans+Condensed:300', name: 'Open Sans Condensed', fontVertShift: -5},
    {css: 'https://fonts.googleapis.com/css?family=Oranienbaum', name: 'Oranienbaum', fontVertShift: 5},
    {css: 'https://fonts.googleapis.com/css?family=Oswald', name: 'Oswald', fontVertShift: -20},

    {css: 'https://fonts.googleapis.com/css?family=Pacifico', name: 'Pacifico', fontVertShift: -35},
    {css: 'https://fonts.googleapis.com/css?family=Pangolin', name: 'Pangolin', fontVertShift: 5},
    {css: 'https://fonts.googleapis.com/css?family=Pattaya', name: 'Pattaya', fontVertShift: 0},
    {css: 'https://fonts.googleapis.com/css?family=Philosopher', name: 'Philosopher', fontVertShift: 5},
    {css: 'https://fonts.googleapis.com/css?family=Play', name: 'Play', fontVertShift: 5},
    {css: 'https://fonts.googleapis.com/css?family=Playfair+Display', name: 'Playfair Display', fontVertShift: -5},
    {css: 'https://fonts.googleapis.com/css?family=Playfair+Display+SC', name: 'Playfair Display SC', fontVertShift: -5},
    {css: 'https://fonts.googleapis.com/css?family=Podkova', name: 'Podkova', fontVertShift: 10},
    {css: 'https://fonts.googleapis.com/css?family=Poiret+One', name: 'Poiret One', fontVertShift: 0},
    {css: 'https://fonts.googleapis.com/css?family=Prata', name: 'Prata', fontVertShift: 5},
    {css: 'https://fonts.googleapis.com/css?family=Prosto+One', name: 'Prosto One', fontVertShift: 0},
    {css: 'https://fonts.googleapis.com/css?family=PT+Mono', name: 'PT Mono', fontVertShift: 5},
    {css: 'https://fonts.googleapis.com/css?family=PT+Sans', name: 'PT Sans', fontVertShift: -10},
    {css: 'https://fonts.googleapis.com/css?family=PT+Sans+Caption', name: 'PT Sans Caption', fontVertShift: -10},
    {css: 'https://fonts.googleapis.com/css?family=PT+Sans+Narrow', name: 'PT Sans Narrow', fontVertShift: -10},
    {css: 'https://fonts.googleapis.com/css?family=PT+Serif', name: 'PT Serif', fontVertShift: -10},
    {css: 'https://fonts.googleapis.com/css?family=PT+Serif+Caption', name: 'PT Serif Caption', fontVertShift: -10},

    {css: 'https://fonts.googleapis.com/css?family=Roboto+Condensed', name: 'Roboto Condensed', fontVertShift: 0},
    {css: 'https://fonts.googleapis.com/css?family=Roboto+Mono', name: 'Roboto Mono', fontVertShift: -5},
    {css: 'https://fonts.googleapis.com/css?family=Roboto+Slab', name: 'Roboto Slab', fontVertShift: 0},
    {css: 'https://fonts.googleapis.com/css?family=Ruslan+Display', name: 'Ruslan Display', fontVertShift: 20},
    {css: 'https://fonts.googleapis.com/css?family=Russo+One', name: 'Russo One', fontVertShift: 5},

    {css: 'https://fonts.googleapis.com/css?family=Sawarabi+Gothic', name: 'Sawarabi Gothic', fontVertShift: -15},
    {css: 'https://fonts.googleapis.com/css?family=Scada', name: 'Scada', fontVertShift: 0},
    {css: 'https://fonts.googleapis.com/css?family=Seymour+One', name: 'Seymour One', fontVertShift: 0},
    {css: 'https://fonts.googleapis.com/css?family=Source+Sans+Pro', name: 'Source Sans Pro', fontVertShift: 0},
    {css: 'https://fonts.googleapis.com/css?family=Spectral', name: 'Spectral', fontVertShift: -5},
    {css: 'https://fonts.googleapis.com/css?family=Stalinist+One', name: 'Stalinist One', fontVertShift: 0},

    {css: 'https://fonts.googleapis.com/css?family=Tinos', name: 'Tinos', fontVertShift: 5},
    {css: 'https://fonts.googleapis.com/css?family=Tenor+Sans', name: 'Tenor Sans', fontVertShift: 5},

    {css: 'https://fonts.googleapis.com/css?family=Underdog', name: 'Underdog', fontVertShift: 10},
    {css: 'https://fonts.googleapis.com/css?family=Ubuntu+Mono', name: 'Ubuntu Mono', fontVertShift: 0},
    {css: 'https://fonts.googleapis.com/css?family=Ubuntu+Condensed', name: 'Ubuntu Condensed', fontVertShift: -5},

    {css: 'https://fonts.googleapis.com/css?family=Vollkorn', name: 'Vollkorn', fontVertShift: -5},
    {css: 'https://fonts.googleapis.com/css?family=Vollkorn+SC', name: 'Vollkorn SC', fontVertShift: 0},

    {css: 'https://fonts.googleapis.com/css?family=Yanone+Kaffeesatz', name: 'Yanone Kaffeesatz', fontVertShift: 20},
    {css: 'https://fonts.googleapis.com/css?family=Yeseva+One', name: 'Yeseva One', fontVertShift: 10},


];

const settingDefaults = {
        textColor: '#000000',
        backgroundColor: '#EBE2C9',
        wallpaper: '',
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

        scrollingDelay: 3000,// замедление, ms
        scrollingType: 'ease-in-out', //linear, ease, ease-in, ease-out, ease-in-out

        pageChangeTransition: '',// '' - нет, downShift, rightShift, thaw - протаивание, blink - мерцание
        pageChangeTransitionSpeed: 50, //0-100%

        allowUrlParamBookPos: false,
        lazyParseEnabled: false,
        copyFullText: false,
        showClickMapPage: true,
        clickControl: true,
        cutEmptyParagraphs: false,
        addEmptyParagraphs: 0,

        fontShifts: {},
};

for (const font of fonts)
    settingDefaults.fontShifts[font.name] = font.fontVertShift;
for (const font of webFonts)
    settingDefaults.fontShifts[font.name] = font.fontVertShift;

// initial state
const state = {
    toolBarActive: true,
    settings: Object.assign({}, settingDefaults),
};

// getters
const getters = {};

// actions
const actions = {};

// mutations
const mutations = {
    setToolBarActive(state, value) {
        state.toolBarActive = value;
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
