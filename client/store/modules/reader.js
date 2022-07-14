import * as utils from '../../share/utils';
import googleFonts from './fonts/fonts.json';

const readerActions = {
    'loader': 'На страницу загрузки',
    'loadFile': 'Загрузить файл с диска',
    'loadBuffer': 'Загрузить из буфера обмена',
    'help': 'Вызвать cправку',    
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
    'clickControl': 'Управление кликом',
    'offlineMode': 'Автономный режим (без интернета)',
    'contents': 'Оглавление/закладки',
    'libs': 'Сетевая библиотека',
    'recentBooks': 'Показать загруженные',
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
    {name: 'loadFile',    show: true},
    {name: 'loadBuffer',  show: true},    
    {name: 'help',        show: true},
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
    {name: 'clickControl', show: false},
    {name: 'offlineMode', show: false},
];

//readerActions[name]
const hotKeys = [
    {name: 'loader', codes: ['Escape']},
    {name: 'loadFile', codes: ['F3']},
    {name: 'loadBuffer', codes: ['F4']},
    {name: 'help', codes: ['F1', 'H']},
    {name: 'settings', codes: ['S']},
    {name: 'undoAction', codes: ['Ctrl+BracketLeft']},
    {name: 'redoAction', codes: ['Ctrl+BracketRight']},
    {name: 'fullScreen', codes: ['Enter', 'Backquote', 'F']},
    {name: 'scrolling', codes: ['Z']},
    {name: 'setPosition', codes: ['P']},
    {name: 'search', codes: ['Ctrl+F']},
    {name: 'copyText', codes: ['Ctrl+Space']},    
    {name: 'convOptions', codes: ['Ctrl+M']},
    {name: 'refresh', codes: ['R']},
    {name: 'contents', codes: ['C']},
    {name: 'libs', codes: ['L']},
    {name: 'recentBooks', codes: ['X']},
    {name: 'clickControl', codes: ['Ctrl+B']},
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

//webFonts: [{css: 'https://fonts.googleapis.com/css?family=Alegreya', name: 'Alegreya', fontVertShift: 0}, ...],
const webFonts = [];
for (const family of googleFonts) {
    webFonts.push({
        css: `https://fonts.googleapis.com/css?family=${family.replace(/\s/g, '+')}`,
        name: family,
        fontVertShift: 0,
    });
}

//----------------------------------------------------------------------------------------------------------
const settingDefaults = {
    textColor: '#000000',
    backgroundColor: '#ebe2c9',
    wallpaper: '',
    wallpaperIgnoreStatusBar: false,
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

    dualPageMode: false,
    dualIndentLR: 10,// px, отступ слева и справа внутри страницы в двухстраничном режиме
    dualDivWidth: 2,// px, ширина разделителя
    dualDivHeight: 100,// процент, высота разделителя
    dualDivColorAsText: true,//цвет как у текста
    dualDivColor: '#000000',
    dualDivColorAlpha: 0.7,// прозрачность разделителя
    dualDivStrokeFill: 1,// px, заполнение пунктира
    dualDivStrokeGap: 1,// px, промежуток пунктира
    dualDivShadowWidth: 0,// px, ширина тени

    showStatusBar: true,
    statusBarTop: false,// top, bottom
    statusBarHeight: 19,// px
    statusBarColorAsText: true,//цвет как у текста
    statusBarColor: '#000000',
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
    toolBarHideOnScroll: true,
    userHotKeys: {},
    userWallpapers: [],

    recentShowSameBook: false,
    recentSortMethod: '',

    needUpdateSettingsView: 0,
};

for (const font of fonts)
    settingDefaults.fontShifts[font.name] = font.fontVertShift;
for (const font of webFonts)
    settingDefaults.fontShifts[font.name] = font.fontVertShift;
for (const button of toolButtons)
    settingDefaults.showToolButton[button.name] = button.show;
for (const hotKey of hotKeys)
    settingDefaults.userHotKeys[hotKey.name] = hotKey.codes;

const diffExclude = [];
for (const hotKey of hotKeys)
    diffExclude.push(`userHotKeys/${hotKey.name}`);
diffExclude.push('userWallpapers');

function addDefaultsToSettings(settings) {
    const diff = utils.getObjDiff(settings, settingDefaults, {exclude: diffExclude});
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
