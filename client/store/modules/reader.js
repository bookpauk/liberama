import * as utils from '../../share/utils';

const readerActions = {
    'help': 'Вызвать cправку',
    'loader': 'На страницу загрузки',
    'settings': 'Настроить',
    'undoAction': 'Действие назад',
    'redoAction': 'Действие вперед',
    'fullScreen': 'На весь экран',
    'scrolling': 'Плавный скроллинг',
    'stopScrolling': '',
    'setPosition': 'Установить позицию',
    'search': 'Найти в тексте',
    'copyText': 'Скопировать текст со страницы',
    'convOptions': 'Настроить конвертирование',
    'refresh': 'Принудительно обновить книгу',
    'offlineMode': 'Автономный режим (без интернета)',
    'contents': 'Оглавление/закладки',
    'libs': 'Сетевая библиотека',
    'recentBooks': 'Открыть недавние',
    'switchToolbar': 'Показать/скрыть панель управления',
    'donate': '',
    'bookBegin': 'В начало книги',
    'bookEnd': 'В конец книги',
    'pageBack': 'Страницу назад',
    'pageForward': 'Страницу вперед',
    'lineBack': 'Строчку назад',
    'lineForward': 'Строчку вперед',
    'incFontSize': 'Увеличить размер шрифта',
    'decFontSize': 'Уменьшить размер шрифта',
    'scrollingSpeedUp': 'Увеличить скорость скроллинга',
    'scrollingSpeedDown': 'Уменьшить скорость скроллинга',
};

//readerActions[name]
const toolButtons = [
    {name: 'undoAction',  show: true},
    {name: 'redoAction',  show: true},
    {name: 'fullScreen',  show: true},
    {name: 'scrolling',   show: false},
    {name: 'setPosition', show: true},
    {name: 'search',      show: true},
    {name: 'copyText',    show: false},
    {name: 'convOptions', show: true},
    {name: 'refresh',     show: true},
    {name: 'contents',    show: true},
    {name: 'libs',        show: true},
    {name: 'recentBooks', show: true},
    {name: 'offlineMode', show: false},
];

//readerActions[name]
const hotKeys = [
    {name: 'help', codes: ['F1', 'H']},
    {name: 'loader', codes: ['Escape']},
    {name: 'settings', codes: ['S']},
    {name: 'undoAction', codes: ['Ctrl+BracketLeft']},
    {name: 'redoAction', codes: ['Ctrl+BracketRight']},
    {name: 'fullScreen', codes: ['Enter', 'Backquote', 'F']},
    {name: 'scrolling', codes: ['Z']},
    {name: 'setPosition', codes: ['P']},
    {name: 'search', codes: ['Ctrl+F']},
    {name: 'copyText', codes: ['Ctrl+C']},    
    {name: 'convOptions', codes: ['Ctrl+M']},
    {name: 'refresh', codes: ['R']},
    {name: 'contents', codes: ['C']},
    {name: 'libs', codes: ['L']},
    {name: 'recentBooks', codes: ['X']},
    {name: 'offlineMode', codes: ['O']},

    {name: 'switchToolbar', codes: ['Tab', 'Q']},
    {name: 'bookBegin', codes: ['Home']},
    {name: 'bookEnd', codes: ['End']},
    {name: 'pageBack', codes: ['PageUp', 'ArrowLeft', 'Backspace', 'Shift+Space']},
    {name: 'pageForward', codes: ['PageDown', 'ArrowRight', 'Space']},
    {name: 'lineBack', codes: ['ArrowUp']},
    {name: 'lineForward', codes: ['ArrowDown']},
    {name: 'incFontSize', codes: ['A']},
    {name: 'decFontSize', codes: ['Shift+A']},
    {name: 'scrollingSpeedUp', codes: ['Shift+ArrowDown']},
    {name: 'scrollingSpeedDown', codes: ['Shift+ArrowUp']},
];

const fonts = [
    {name: 'ReaderDefault', label: 'По-умолчанию', fontVertShift: 0},
    {name: 'GEO_1', label: 'BPG Arial', fontVertShift: 10},
    {name: 'Arimo', fontVertShift: 0},
    {name: 'Avrile', fontVertShift: -10},
    {name: 'OpenSans', fontVertShift: -5},
    {name: 'Roboto', fontVertShift: 0},
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

//----------------------------------------------------------------------------------------------------------
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
    textVertShift: 0,

    lineInterval: 3,// px, межстрочный интервал
    textAlignJustify: true,// выравнивание по ширине
    p: 25,// px, отступ параграфа
    indentLR: 15,// px, отступ всего текста слева и справа
    indentTB: 0,// px, отступ всего текста сверху и снизу
    wordWrap: true,//перенос по слогам
    keepLastToFirst: false,// перенос последней строки в первую при листании

    showStatusBar: true,
    statusBarTop: false,// top, bottom
    statusBarHeight: 19,// px
    statusBarColorAlpha: 0.4,
    statusBarClickOpen: true,

    scrollingDelay: 3000,// замедление, ms
    scrollingType: 'ease-in-out', //linear, ease, ease-in, ease-out, ease-in-out

    pageChangeAnimation: 'blink',// '' - нет, downShift, rightShift, thaw - протаивание, blink - мерцание, rotate - вращение, flip - листание
    pageChangeAnimationSpeed: 80, //0-100%

    allowUrlParamBookPos: false,
    lazyParseEnabled: false,
    copyFullText: false,
    showClickMapPage: true,
    clickControl: true,
    cutEmptyParagraphs: false,
    addEmptyParagraphs: 0,
    blinkCachedLoad: true,
    showImages: true,
    showInlineImagesInCenter: true,
    compactTextPerc: 0,
    imageHeightLines: 100,
    imageFitWidth: true,
    enableSitesFilter: true,
    splitToPara: false,
    djvuQuality: 20,
    pdfAsText: true,
    pdfQuality: 20,

    showServerStorageMessages: true,
    showWhatsNewDialog: true,
    showDonationDialog2020: true,
    showNeedUpdateNotify: true,

    fontShifts: {},
    showToolButton: {},
    userHotKeys: {},
};

for (const font of fonts)
    settingDefaults.fontShifts[font.name] = font.fontVertShift;
for (const font of webFonts)
    settingDefaults.fontShifts[font.name] = font.fontVertShift;
for (const button of toolButtons)
    settingDefaults.showToolButton[button.name] = button.show;
for (const hotKey of hotKeys)
    settingDefaults.userHotKeys[hotKey.name] = hotKey.codes;

const excludeDiffHotKeys = [];
for (const hotKey of hotKeys)
    excludeDiffHotKeys.push(`userHotKeys/${hotKey.name}`);

function addDefaultsToSettings(settings) {
    const diff = utils.getObjDiff(settings, settingDefaults, {exclude: excludeDiffHotKeys});
    if (!utils.isEmptyObjDiffDeep(diff, {isApplyChange: false})) {
        return utils.applyObjDiff(settings, diff, {isApplyChange: false});
    }

    return false;
}

const libsDefaults = {
    startLink: 'http://flibusta.is',
    comment: 'Флибуста | Книжное братство',
    closeAfterSubmit: false,
    openInFrameOnEnter: false,
    openInFrameOnAdd: false,
    groups: [
        {r: 'http://flibusta.is', s: 'http://flibusta.is', list: [
            {l: 'http://flibusta.is', c: 'Флибуста | Книжное братство'},
        ]},
        {r: 'https://flibs.in', s: 'https://flibs.in', list: [
            {l: 'https://flibs.in', c: 'Flibs'},
        ]},
        {r: 'http://fantasy-worlds.org', s: 'http://fantasy-worlds.org', list: [
            {l: 'http://fantasy-worlds.org', c: 'Миры Фэнтези'},
        ]},
        {r: 'http://samlib.ru', s: 'http://samlib.ru', list: [
            {l: 'http://samlib.ru', c: 'Журнал "Самиздат"'},
        ]},
        {r: 'http://lib.ru', s: 'http://lib.ru', list: [
            {l: 'http://lib.ru', c: 'Библиотека Максима Мошкова'},
        ]},
        {r: 'https://aldebaran.ru', s: 'https://aldebaran.ru', list: [
            {l: 'https://aldebaran.ru', c: 'АЛЬДЕБАРАН | Электронная библиотека книг'},
        ]},
    ]
};

// initial state
const state = {
    toolBarActive: true,
    serverSyncEnabled: false,
    serverStorageKey: '',
    profiles: {},
    profilesRev: 0,
    allowProfilesSave: false,//подстраховка для разработки
    whatsNewContentHash: '',
    donationRemindDate: '',
    currentProfile: '',
    settings: Object.assign({}, settingDefaults),
    settingsRev: {},
    libs: Object.assign({}, libsDefaults),
    libsRev: 0,
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
    setServerSyncEnabled(state, value) {
        state.serverSyncEnabled = value;
    },
    setServerStorageKey(state, value) {
        state.serverStorageKey = value;
    },
    setProfiles(state, value) {
        state.profiles = value;
    },
    setProfilesRev(state, value) {
        state.profilesRev = value;
    },
    setAllowProfilesSave(state, value) {
        state.allowProfilesSave = value;
    },
    setWhatsNewContentHash(state, value) {
        state.whatsNewContentHash = value;
    },
    setDonationRemindDate(state, value) {
        state.donationRemindDate = value;
    },
    setCurrentProfile(state, value) {
        state.currentProfile = value;
    },
    setSettings(state, value) {
        const newSettings = Object.assign({}, state.settings, value);
        const added = addDefaultsToSettings(newSettings);
        if (added) {
            state.settings = added;
        } else {
            state.settings = newSettings;
        }
    },
    setSettingsRev(state, value) {
        state.settingsRev = Object.assign({}, state.settingsRev, value);
    },
    setLibs(state, value) {
        state.libs = value;
    },
    setLibsRev(state, value) {
        state.libsRev = value;
    },
};

export default {
    readerActions,
    toolButtons,
    hotKeys,
    fonts,
    webFonts,
    settingDefaults,
    addDefaultsToSettings,
    libsDefaults,

    namespaced: true,
    state,
    getters,
    actions,
    mutations
};
