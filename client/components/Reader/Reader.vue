<template>
    <el-container>
        <el-header v-show="toolBarActive" height='50px'>
            <div class="header">
                <el-tooltip content="Загрузить книгу" :open-delay="1000" effect="light">
                    <el-button ref="loader" class="tool-button" :class="buttonActiveClass('loader')" @click="buttonClick('loader')"><i class="el-icon-back"></i></el-button>
                </el-tooltip>

                <div>
                    <el-tooltip v-show="showToolButton['undoAction']" content="Действие назад" :open-delay="1000" effect="light">
                        <el-button ref="undoAction" class="tool-button" :class="buttonActiveClass('undoAction')" @click="buttonClick('undoAction')" ><i class="el-icon-arrow-left"></i></el-button>
                    </el-tooltip>
                    <el-tooltip v-show="showToolButton['redoAction']" content="Действие вперед" :open-delay="1000" effect="light">
                        <el-button ref="redoAction" class="tool-button" :class="buttonActiveClass('redoAction')" @click="buttonClick('redoAction')" ><i class="el-icon-arrow-right"></i></el-button>
                    </el-tooltip>
                    <div class="space"></div>
                    <el-tooltip v-show="showToolButton['fullScreen']" content="На весь экран" :open-delay="1000" effect="light">
                        <el-button ref="fullScreen" class="tool-button" :class="buttonActiveClass('fullScreen')" @click="buttonClick('fullScreen')"><i class="el-icon-rank"></i></el-button>
                    </el-tooltip>
                    <el-tooltip v-show="showToolButton['scrolling']" content="Плавный скроллинг" :open-delay="1000" effect="light">
                        <el-button ref="scrolling" class="tool-button" :class="buttonActiveClass('scrolling')" @click="buttonClick('scrolling')"><i class="el-icon-sort"></i></el-button>
                    </el-tooltip>
                    <el-tooltip v-show="showToolButton['setPosition']" content="На страницу" :open-delay="1000" effect="light">
                        <el-button ref="setPosition" class="tool-button" :class="buttonActiveClass('setPosition')" @click="buttonClick('setPosition')"><i class="el-icon-d-arrow-right"></i></el-button>
                    </el-tooltip>
                    <el-tooltip v-show="showToolButton['search']" content="Найти в тексте" :open-delay="1000" effect="light">
                        <el-button ref="search" class="tool-button" :class="buttonActiveClass('search')" @click="buttonClick('search')"><i class="el-icon-search"></i></el-button>
                    </el-tooltip>
                    <el-tooltip v-show="showToolButton['copyText']" content="Скопировать текст со страницы" :open-delay="1000" effect="light">
                        <el-button ref="copyText" class="tool-button" :class="buttonActiveClass('copyText')" @click="buttonClick('copyText')"><i class="el-icon-edit-outline"></i></el-button>
                    </el-tooltip>
                    <el-tooltip v-show="showToolButton['refresh']" content="Принудительно обновить книгу в обход кэша" :open-delay="1000" effect="light">
                        <el-button ref="refresh" class="tool-button" :class="buttonActiveClass('refresh')" @click="buttonClick('refresh')">
                            <i class="el-icon-refresh" :class="{clear: !showRefreshIcon}"></i>
                        </el-button>
                    </el-tooltip>
                    <div class="space"></div>
                    <el-tooltip v-show="showToolButton['history']" content="Открыть недавние" :open-delay="1000" effect="light">
                        <el-button ref="history" class="tool-button" :class="buttonActiveClass('history')" @click="buttonClick('history')"><i class="el-icon-document"></i></el-button>
                    </el-tooltip>
                </div>

                <el-tooltip content="Настроить" :open-delay="1000" effect="light">
                    <el-button ref="settings" class="tool-button" :class="buttonActiveClass('settings')" @click="buttonClick('settings')"><i class="el-icon-setting"></i></el-button>            
                </el-tooltip>
            </div>
        </el-header>

        <el-main>
            <keep-alive>
                <component ref="page" :is="activePage"
                    @load-book="loadBook"
                    @load-file="loadFile"
                    @book-pos-changed="bookPosChanged"
                    @tool-bar-toggle="toolBarToggle"
                    @full-screen-toogle="fullScreenToggle"
                    @stop-scrolling="stopScrolling"
                    @scrolling-toggle="scrollingToggle"
                    @help-toggle="helpToggle"
                    @donate-toggle="donateToggle"
                ></component>
            </keep-alive>

            <SetPositionPage v-if="setPositionActive" ref="setPositionPage" @set-position-toggle="setPositionToggle" @book-pos-changed="bookPosChanged"></SetPositionPage>
            <SearchPage v-show="searchActive" ref="searchPage" 
                @search-toggle="searchToggle" 
                @book-pos-changed="bookPosChanged"
                @start-text-search="startTextSearch"
                @stop-text-search="stopTextSearch">
            </SearchPage>
            <CopyTextPage v-if="copyTextActive" ref="copyTextPage" @copy-text-toggle="copyTextToggle"></CopyTextPage>
            <HistoryPage v-show="historyActive" ref="historyPage" @load-book="loadBook" @history-toggle="historyToggle"></HistoryPage>
            <SettingsPage v-if="settingsActive" ref="settingsPage" @settings-toggle="settingsToggle"></SettingsPage>
            <HelpPage v-if="helpActive" ref="helpPage" @help-toggle="helpToggle"></HelpPage>
            <ClickMapPage v-show="clickMapActive" ref="clickMapPage"></ClickMapPage>
            <ServerStorage v-show="hidden" ref="serverStorage"></ServerStorage>

            <el-dialog
                title="Что нового:"
                :visible.sync="whatsNewVisible"
                width="60%">
                <div v-html="whatsNewContent"></div>

                <span class="clickable" @click="openVersionHistory">Посмотреть историю версий</span>
                <span slot="footer" class="dialog-footer">
                    <el-button @click="whatsNewDisable">Больше не показывать</el-button>
                </span>
            </el-dialog>

        </el-main>

    </el-container>
</template>

<script>
//-----------------------------------------------------------------------------
import Vue from 'vue';
import Component from 'vue-class-component';
import _ from 'lodash';
import {Buffer} from 'safe-buffer';

import LoaderPage from './LoaderPage/LoaderPage.vue';
import TextPage from './TextPage/TextPage.vue';
import ProgressPage from './ProgressPage/ProgressPage.vue';

import SetPositionPage from './SetPositionPage/SetPositionPage.vue';
import SearchPage from './SearchPage/SearchPage.vue';
import CopyTextPage from './CopyTextPage/CopyTextPage.vue';
import HistoryPage from './HistoryPage/HistoryPage.vue';
import SettingsPage from './SettingsPage/SettingsPage.vue';
import HelpPage from './HelpPage/HelpPage.vue';
import ClickMapPage from './ClickMapPage/ClickMapPage.vue';
import ServerStorage from './ServerStorage/ServerStorage.vue';

import bookManager from './share/bookManager';
import readerApi from '../../api/reader';
import * as utils from '../../share/utils';
import {versionHistory} from './versionHistory';

export default @Component({
    components: {
        LoaderPage,
        TextPage,
        ProgressPage,

        SetPositionPage,
        SearchPage,
        CopyTextPage,
        HistoryPage,
        SettingsPage,
        HelpPage,
        ClickMapPage,
        ServerStorage,
    },
    watch: {
        bookPos: function(newValue) {
            if (newValue !== undefined && this.activePage == 'TextPage') {
                const textPage = this.$refs.page;
                if (textPage.bookPos != newValue) {
                    textPage.bookPos = newValue;
                }
                this.debouncedSetRecentBook(newValue);
            }
        },
        routeParamPos: function(newValue) {
            if (newValue !== undefined && newValue != this.bookPos) {
                this.bookPos = newValue;
            }
        },
        routeParamUrl: function(newValue) {
            if (newValue !== '' && newValue !== this.mostRecentBook().url) {
                this.loadBook({url: newValue, bookPos: this.routeParamPos});
            }
        },
        settings: function() {
            this.loadSettings();
            this.updateRoute();
        },
        loaderActive: function(newValue) {
            const recent = this.mostRecentBook();
            if (!newValue && !this.loading && recent && !bookManager.hasBookParsed(recent)) {
                this.loadBook(recent);
            }
        },
    },
})
class Reader extends Vue {
    loaderActive = false;
    progressActive = false;
    fullScreenActive = false;

    scrollingActive = false;
    setPositionActive = false;
    searchActive = false;
    copyTextActive = false;
    historyActive = false;
    settingsActive = false;
    helpActive = false;
    clickMapActive = false;

    bookPos = null;
    allowUrlParamBookPos = false;
    showRefreshIcon = true;
    mostRecentBookReactive = null;
    showToolButton = {};

    actionList = [];
    actionCur = -1;
    hidden = false;

    whatsNewVisible = false;
    whatsNewContent = '';

    created() {
        this.loading = true;
        this.commit = this.$store.commit;
        this.dispatch = this.$store.dispatch;
        this.reader = this.$store.state.reader;
        this.config = this.$store.state.config;

        this.$root.addKeyHook(this.keyHook);

        this.lastActivePage = false;

        this.debouncedUpdateRoute = _.debounce(() => {
            this.updateRoute();
        }, 1000);

        this.debouncedSetRecentBook = _.debounce(async(newValue) => {
            const recent = this.mostRecentBook();
            if (recent && (recent.bookPos != newValue || recent.bookPosSeen !== this.bookPosSeen)) {
                await bookManager.setRecentBook(Object.assign({}, recent, {bookPos: newValue, bookPosSeen: this.bookPosSeen}));

                if (this.actionCur < 0 || (this.actionCur >= 0 && this.actionList[this.actionCur] != newValue))
                    this.addAction(newValue);
            }
        }, 500);

        this.debouncedSaveRecent = _.debounce(async() => {
            const serverStorage = this.$refs.serverStorage;
            while (!serverStorage.inited) await utils.sleep(1000);
            await serverStorage.saveRecent();
        }, 1000);

        this.debouncedSaveRecentLast = _.debounce(async() => {
            const serverStorage = this.$refs.serverStorage;
            while (!serverStorage.inited) await utils.sleep(1000);
            await serverStorage.saveRecentLast();
        }, 1000);

        document.addEventListener('fullscreenchange', () => {
            this.fullScreenActive = (document.fullscreenElement !== null);
        });

        this.loadSettings();
    }

    mounted() {
        (async() => {
            await bookManager.init(this.settings);
            bookManager.addEventListener(this.bookManagerEvent);

            if (this.$root.rootRoute == '/reader') {
                if (this.routeParamUrl) {
                    await this.loadBook({url: this.routeParamUrl, bookPos: this.routeParamPos});
                } else {
                    this.loaderActive = true;
                }
            }

            this.checkSetStorageAccessKey();
            this.checkActivateDonateHelpPage();
            this.loading = false;

            await this.showWhatsNew();
        })();
    }

    loadSettings() {
        const settings = this.settings;
        this.allowUrlParamBookPos = settings.allowUrlParamBookPos;
        this.copyFullText = settings.copyFullText;
        this.showClickMapPage = settings.showClickMapPage;
        this.clickControl = settings.clickControl;
        this.blinkCachedLoad = settings.blinkCachedLoad;
        this.showWhatsNewDialog = settings.showWhatsNewDialog;
        this.showToolButton = settings.showToolButton;
    }

    checkSetStorageAccessKey() {
        const q = this.$route.query;

        if (q['setStorageAccessKey']) {
            this.$router.replace(`/reader`);
            this.settingsToggle();
            this.$nextTick(() => {
                this.$refs.settingsPage.enterServerStorageKey(
                    Buffer.from(utils.fromBase58(q['setStorageAccessKey'])).toString()
                );
            });
        }
    }

    checkActivateDonateHelpPage() {
        const q = this.$route.query;

        if (q['donate']) {
            this.$router.replace(`/reader`);
            this.helpToggle();
            this.$nextTick(() => {
                this.$refs.helpPage.activateDonateHelpPage();
            });
        }
    }

    async showWhatsNew() {
        await utils.sleep(2000);

        const whatsNew = versionHistory[0];
        if (this.showWhatsNewDialog &&
            whatsNew.showUntil >= utils.formatDate(new Date(), 'coDate') &&
            whatsNew.header != this.whatsNewContentHash) {
            this.whatsNewContent = 'Версия ' + whatsNew.header + whatsNew.content;
            this.whatsNewVisible = true;
        }
    }

    openVersionHistory() {
        this.whatsNewVisible = false;
        this.versionHistoryToggle();
    }

    whatsNewDisable() {
        this.whatsNewVisible = false;
        const whatsNew = versionHistory[0];
        this.commit('reader/setWhatsNewContentHash', whatsNew.header);
    }

    get routeParamPos() {
        let result = undefined;
        const q = this.$route.query;
        if (q['__p']) {
            result = q['__p'];
            if (Array.isArray(result))
                result = result[0];
        }
        
        return (result ? parseInt(result, 10) || 0 : result);
    }

    updateRoute(isNewRoute) {
        if (this.loading)
            return;
        const recent = this.mostRecentBook();
        const pos = (recent && recent.bookPos && this.allowUrlParamBookPos ? `__p=${recent.bookPos}&` : '');
        const url = (recent ? `url=${recent.url}` : '');
        if (isNewRoute)
            this.$router.push(`/reader?${pos}${url}`);
        else
            this.$router.replace(`/reader?${pos}${url}`);

    }

    get routeParamUrl() {
        let result = '';
        const path = this.$route.fullPath;
        const i = path.indexOf('url=');
        if (i >= 0) {
            result = path.substr(i + 4);
        }
        
        return decodeURIComponent(result);
    }

    bookPosChanged(event) {
        if (event.bookPosSeen !== undefined)
            this.bookPosSeen = event.bookPosSeen;
        this.bookPos = event.bookPos;
        this.debouncedUpdateRoute();
    }

    async bookManagerEvent(eventName) {
        const serverStorage = this.$refs.serverStorage;
        if (eventName == 'load-meta-finish') {
            serverStorage.init();
            const result = await bookManager.cleanRecentBooks();
            if (result)
                this.debouncedSaveRecent();
        }

        if (eventName == 'recent-changed' || eventName == 'save-recent') {
            if (this.historyActive) {
                this.$refs.historyPage.updateTableData();
            }

            const oldBook = this.mostRecentBookReactive;
            const newBook = bookManager.mostRecentBook();

            if (oldBook && newBook) {
                if (oldBook.key != newBook.key) {
                    this.loadingBook = true;
                    try {
                        await this.loadBook(newBook);
                    } finally {
                        this.loadingBook = false;
                    }
                } else if (oldBook.bookPos != newBook.bookPos) {
                    while (this.loadingBook) await utils.sleep(100);
                    this.bookPosChanged({bookPos: newBook.bookPos});
                }
            }

            if (eventName == 'recent-changed') {
                this.debouncedSaveRecentLast();
            } else {
                this.debouncedSaveRecent();
            }
        }
    }

    get toolBarActive() {
        return this.reader.toolBarActive;
    }

    mostRecentBook() {
        const result = bookManager.mostRecentBook();
        this.mostRecentBookReactive = result;
        return result;
    }

    get settings() {
        return this.$store.state.reader.settings;
    }

    get whatsNewContentHash() {
        return this.$store.state.reader.whatsNewContentHash;
    }

    addAction(pos) {
        let a = this.actionList;
        if (!a.length || a[a.length - 1] != pos) {
            a.push(pos);
            if (a.length > 20)
                a.shift();
            this.actionCur = a.length - 1;
        }
    }

    toolBarToggle() {
        this.commit('reader/setToolBarActive', !this.toolBarActive);
        this.$root.$emit('resize');
    }

    fullScreenToggle() {
        this.fullScreenActive = !this.fullScreenActive;
        if (this.fullScreenActive) {
            const element = document.documentElement;
            if (element.requestFullscreen) {
                element.requestFullscreen();
            } else if (element.webkitrequestFullscreen) {
                element.webkitRequestFullscreen();
            } else if (element.mozRequestFullscreen) {
                element.mozRequestFullScreen();
            }
        } else {
            if (document.cancelFullScreen) {
                document.cancelFullScreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitCancelFullScreen) {
                document.webkitCancelFullScreen();
            }
        }
    }

    closeAllTextPages() {
        this.setPositionActive = false;
        this.copyTextActive = false;
        this.historyActive = false;
        this.settingsActive = false;
        this.stopScrolling();
        this.stopSearch();
        this.helpActive = false;
    }

    loaderToggle() {
        this.loaderActive = !this.loaderActive;
        if (this.loaderActive) {
            this.closeAllTextPages();
        }
    }

    setPositionToggle() {
        this.setPositionActive = !this.setPositionActive;
        if (this.setPositionActive && this.activePage == 'TextPage' && this.mostRecentBook()) {
            this.closeAllTextPages();
            this.setPositionActive = true;

            this.$nextTick(() => {
                const recent = this.mostRecentBook();
                this.$refs.setPositionPage.init(recent.bookPos, recent.textLength - 1);
            });
        } else {
            this.setPositionActive = false;
        }
    }

    stopScrolling() {
        if (this.scrollingActive)
            this.scrollingToggle();
    }

    scrollingToggle() {
        this.scrollingActive = !this.scrollingActive;
        if (this.activePage == 'TextPage') {
            const page = this.$refs.page;
            if (this.scrollingActive) {
                page.startTextScrolling();
            } else {
                page.stopTextScrolling();
            }
        }
    }

    stopSearch() {
        if (this.searchActive)
            this.searchToggle();
    }

    startTextSearch(opts) {
        if (this.activePage == 'TextPage')
            this.$refs.page.startSearch(opts.needle);
    }

    stopTextSearch() {
        if (this.activePage == 'TextPage')
            this.$refs.page.stopSearch();
    }

    searchToggle() {
        this.searchActive = !this.searchActive;
        const page = this.$refs.page;
        if (this.searchActive && this.activePage == 'TextPage' && page.parsed) {
            this.closeAllTextPages();
            this.searchActive = true;

            this.$nextTick(() => {
                this.$refs.searchPage.init(page.parsed);
            });
        } else {
            this.stopTextSearch();
            this.searchActive = false;
        }
    }

    copyTextToggle() {
        this.copyTextActive = !this.copyTextActive;
        const page = this.$refs.page;
        if (this.copyTextActive && this.activePage == 'TextPage' && page.parsed) {
            this.closeAllTextPages();
            this.copyTextActive = true;

            this.$nextTick(() => {
                this.$refs.copyTextPage.init(this.mostRecentBook().bookPos, page.parsed, this.copyFullText);
            });
        } else {
            this.copyTextActive = false;
        }
    }

    historyToggle() {
        this.historyActive = !this.historyActive;
        if (this.historyActive) {
            this.closeAllTextPages();
            this.$refs.historyPage.init();
            this.historyActive = true;
        } else {
            this.historyActive = false;
        }
    }

    settingsToggle() {
        this.settingsActive = !this.settingsActive;
        if (this.settingsActive) {
            this.closeAllTextPages();
            this.settingsActive = true;
        } else {
            this.settingsActive = false;
        }
    }

    helpToggle() {
        this.helpActive = !this.helpActive;
        if (this.helpActive) {
            this.closeAllTextPages();
            this.helpActive = true;
        }
    }

    donateToggle() {
        this.helpToggle();
        if (this.helpActive) {
            this.$nextTick(() => {
                this.$refs.helpPage.activateDonateHelpPage();
            });
        }
    }

    versionHistoryToggle() {
        this.helpToggle();
        if (this.helpActive) {
            this.$nextTick(() => {
                this.$refs.helpPage.activateVersionHistoryHelpPage();
            });
        }
    }

    refreshBook() {
        if (this.mostRecentBook()) {
            this.loadBook({url: this.mostRecentBook().url, force: true});
        }
    }

    buttonClick(button) {
        const activeClass = this.buttonActiveClass(button);

        this.$refs[button].$el.blur();

        if (activeClass['tool-button-disabled'])
            return;
        
        switch (button) {
            case 'loader':
                this.loaderToggle();
                break;
            case 'undoAction':
                if (this.actionCur > 0) {
                    this.actionCur--;
                    this.bookPosChanged({bookPos: this.actionList[this.actionCur]});
                }
                break;
            case 'redoAction':
                if (this.actionCur < this.actionList.length - 1) {
                    this.actionCur++;
                    this.bookPosChanged({bookPos: this.actionList[this.actionCur]});
                }
                break;
            case 'fullScreen':
                this.fullScreenToggle();
                break;
            case 'setPosition':
                this.setPositionToggle();
                break;
            case 'scrolling':
                this.scrollingToggle();
                break;
            case 'search':
                this.searchToggle();
                break;
            case 'copyText':
                this.copyTextToggle();
                break;
            case 'history':
                this.historyToggle();
                break;
            case 'refresh':
                this.refreshBook();
                break;
            case 'settings':
                this.settingsToggle();
                break;
        }
    }

    buttonActiveClass(button) {
        const classActive = { 'tool-button-active': true, 'tool-button-active:hover': true };
        const classDisabled = { 'tool-button-disabled': true, 'tool-button-disabled:hover': true };
        let classResult = {};

        switch (button) {
            case 'loader':
            case 'fullScreen':
            case 'setPosition':
            case 'scrolling':
            case 'search':
            case 'copyText':
            case 'history':
            case 'settings':
                if (this[`${button}Active`])
                    classResult = classActive;
                break;
        }

        switch (button) {
            case 'undoAction':
                if (this.actionCur <= 0)
                    classResult = classDisabled;
                break;
            case 'redoAction':
                if (this.actionCur == this.actionList.length - 1)
                    classResult = classDisabled;
                break;
        }

        if (this.activePage == 'LoaderPage' || !this.mostRecentBook()) {
            switch (button) {
                case 'undoAction':
                case 'redoAction':
                case 'setPosition':
                case 'scrolling':
                case 'search':
                case 'copyText':
                    classResult = classDisabled;
                    break;
                case 'history':
                case 'refresh':
                    if (!this.mostRecentBook())
                        classResult = classDisabled;
                    break;
            }
        }

        return classResult;
    }

    async activateClickMapPage() {
        if (this.clickControl && this.showClickMapPage && !this.clickMapActive) {
            this.clickMapActive = true;
            await this.$refs.clickMapPage.slowDisappear();
            this.clickMapActive = false;
        }
    }

    get activePage() {
        let result = '';

        if (this.progressActive)
            result = 'ProgressPage';
        else if (this.loaderActive)
            result = 'LoaderPage';
        else if (this.mostRecentBookReactive)
            result = 'TextPage';

        if (!result && !this.loading) {
            this.loaderActive = true;
            result = 'LoaderPage';
        }

        if (result != 'TextPage') {
            this.$root.$emit('set-app-title');
        }

        // на LoaderPage всегда показываем toolBar
        if (result == 'LoaderPage' && !this.toolBarActive) {
            this.toolBarToggle();
        }

        if (this.lastActivePage != result && result == 'TextPage') {
            //акивируем страницу с текстом
            this.$nextTick(async() => {
                const last = this.mostRecentBookReactive;
                const isParsed = bookManager.hasBookParsed(last);
                if (!isParsed) {
                    this.$root.$emit('set-app-title');
                    return;
                }

                this.updateRoute();
                const textPage = this.$refs.page;
                if (textPage.showBook) {
                    textPage.lastBook = last;
                    textPage.bookPos = (last.bookPos !== undefined ? last.bookPos : 0);

                    textPage.showBook();
                }
            });
        }

        this.lastActivePage = result;
        return result;
    }

    async loadBook(opts) {
        if (!opts || !opts.url) {
            this.mostRecentBook();
            return;
        }

        let url = opts.url;
        if ((url.indexOf('http://') != 0) && (url.indexOf('https://') != 0) &&
            (url.indexOf('file://') != 0))
            url = 'http://' + url;

        // уже просматривается сейчас
        const lastBook = (this.$refs.page ? this.$refs.page.lastBook : null);
        if (!opts.force && lastBook && lastBook.url == url && bookManager.hasBookParsed(lastBook)) {
            this.loaderActive = false;
            return;
        }

        this.progressActive = true;

        await this.$nextTick();

        const progress = this.$refs.page;

        this.actionList = [];
        this.actionCur = -1;

        try {
            progress.show();
            progress.setState({state: 'parse'});

            // есть ли среди недавних
            const key = bookManager.keyFromUrl(url);
            let wasOpened = await bookManager.getRecentBook({key});
            wasOpened = (wasOpened ? wasOpened : {});
            const bookPos = (opts.bookPos !== undefined ? opts.bookPos : wasOpened.bookPos);
            const bookPosSeen = (opts.bookPos !== undefined ? opts.bookPos : wasOpened.bookPosSeen);

            let book = null;

            if (!opts.force) {
                // пытаемся загрузить и распарсить книгу в менеджере из локального кэша
                const bookParsed = await bookManager.getBook({url}, (prog) => {
                    progress.setState({progress: prog});
                });

                // если есть в локальном кэше
                if (bookParsed) {
                    await bookManager.setRecentBook(Object.assign({bookPos, bookPosSeen}, bookParsed));
                    this.mostRecentBook();
                    this.addAction(bookPos);
                    this.loaderActive = false;
                    progress.hide(); this.progressActive = false;
                    this.blinkCachedLoadMessage();

                    await this.activateClickMapPage();
                    return;
                }

                // иначе идем на сервер
                // пытаемся загрузить готовый файл с сервера
                if (wasOpened.path) {
                    try {
                        const resp = await readerApi.loadCachedBook(wasOpened.path, (state) => {
                            progress.setState(state);
                        });
                        book = Object.assign({}, wasOpened, {data: resp.data});
                    } catch (e) {
                        //молчим
                    }
                }
            }

            progress.setState({totalSteps: 5});

            // не удалось, скачиваем книгу полностью с конвертацией
            let loadCached = true;
            if (!book) {
                book = await readerApi.loadBook(url, (state) => {
                    progress.setState(state);
                });
                loadCached = false;
            }

            // добавляем в bookManager
            progress.setState({state: 'parse', step: 5});
            const addedBook = await bookManager.addBook(book, (prog) => {
                progress.setState({progress: prog});
            });

            // добавляем в историю
            await bookManager.setRecentBook(Object.assign({bookPos, bookPosSeen}, addedBook));
            this.mostRecentBook();
            this.addAction(bookPos);
            this.updateRoute(true);

            this.loaderActive = false;
            progress.hide(); this.progressActive = false;
            if (loadCached) {
                this.blinkCachedLoadMessage();
            } else
                this.stopBlink = true;

            await this.activateClickMapPage();
        } catch (e) {
            progress.hide(); this.progressActive = false;
            this.loaderActive = true;
            this.$alert(e.message, 'Ошибка', {type: 'error'});
        }
    }

    async loadFile(opts) {
        this.progressActive = true;

        await this.$nextTick();

        const progress = this.$refs.page;
        try {
            progress.show();
            progress.setState({state: 'upload'});

            const url = await readerApi.uploadFile(opts.file, this.config.maxUploadFileSize, (state) => {
                progress.setState(state);
            });

            progress.hide(); this.progressActive = false;

            await this.loadBook({url});
        } catch (e) {
            progress.hide(); this.progressActive = false;
            this.loaderActive = true;
            this.$alert(e.message, 'Ошибка', {type: 'error'});
        }
    }

    blinkCachedLoadMessage() {
        if (!this.blinkCachedLoad)
            return;

        this.blinkCount = 30;
        if (!this.inBlink) {
            this.inBlink = true;
            this.stopBlink = false;
            this.$nextTick(async() => {
                let page = this.$refs.page;
                while (this.blinkCount) {
                    this.showRefreshIcon = !this.showRefreshIcon;
                    if (page.blinkCachedLoadMessage)
                        page.blinkCachedLoadMessage(this.showRefreshIcon);
                    await utils.sleep(500);
                    if (this.stopBlink)
                        break;
                    this.blinkCount--;
                    page = this.$refs.page;
                }
                this.showRefreshIcon = true;
                this.inBlink = false;
                if (page.blinkCachedLoadMessage)
                    page.blinkCachedLoadMessage('finish');
            });
        }
    }

    keyHook(event) {
        if (this.$root.rootRoute == '/reader') {
            let handled = false;
            if (!handled && this.helpActive)
                handled = this.$refs.helpPage.keyHook(event);

            if (!handled && this.settingsActive)
                handled = this.$refs.settingsPage.keyHook(event);

            if (!handled && this.historyActive)
                handled = this.$refs.historyPage.keyHook(event);

            if (!handled && this.setPositionActive)
                handled = this.$refs.setPositionPage.keyHook(event);

            if (!handled && this.searchActive)
                handled = this.$refs.searchPage.keyHook(event);

            if (!handled && this.copyTextActive)
                handled = this.$refs.copyTextPage.keyHook(event);

            if (!handled && this.$refs.page && this.$refs.page.keyHook)
                handled = this.$refs.page.keyHook(event);

            if (!handled && event.type == 'keydown') {
                if (event.code == 'Escape')
                    this.loaderToggle();

                if (this.activePage == 'TextPage') {
                    switch (event.code) {
                        case 'KeyH':
                        case 'F1':
                            this.helpToggle();
                            event.preventDefault();
                            event.stopPropagation();
                            break;
                        case 'KeyZ':
                            this.scrollingToggle();
                            break;
                        case 'KeyP':
                            this.setPositionToggle();
                            break;
                        case 'KeyF':
                            if (event.ctrlKey) {
                                this.searchToggle();
                                event.preventDefault();
                                event.stopPropagation();
                            }
                            break;
                        case 'KeyC':
                            if (event.ctrlKey) {
                                this.copyTextToggle();
                                event.preventDefault();
                                event.stopPropagation();
                            }
                            break;
                        case 'KeyR':
                            this.refreshBook();
                            break;
                        case 'KeyX':
                            this.historyToggle();
                            event.preventDefault();
                            event.stopPropagation();
                            break;
                        case 'KeyS':
                            this.settingsToggle();
                            break;
                    }
                }
            }
        }
    }
}
//-----------------------------------------------------------------------------
</script>

<style scoped>
.el-container {
    padding: 0;
    margin: 0;
    height: 100%;
}

.el-header {
    padding-left: 5px;
    padding-right: 5px;
    background-color: #1B695F;
    color: #000;
    overflow-x: auto;
    overflow-y: hidden;
}
  
.header {
    display: flex;
    justify-content: space-between;
    min-width: 550px;
}

.el-main {
    position: relative;
    display: flex;
    padding: 0;
    margin: 0;
    background-color: #EBE2C9;
    color: #000;
}

.tool-button {
    margin: 0 2px 0 2px;
    padding: 0;
    color: #3E843E;
    background-color: #E6EDF4;
    margin-top: 5px;
    height: 38px;
    width: 38px;
    border: 0;
    box-shadow: 3px 3px 5px black;
}

.tool-button:hover {
    background-color: white;
}

.tool-button-active {
    box-shadow: 0 0 0;
    color: white;
    background-color: #8AB45F;
    position: relative;
    top: 1px;
    left: 1px;
}

.tool-button-active:hover {
    color: white;
    background-color: #81C581;
}

.tool-button-disabled {
    color: lightgray;
    background-color: gray;
}

.tool-button-disabled:hover {
    color: lightgray;
    background-color: gray;
}

i {
    font-size: 200%;
}

.space {
    width: 10px;
    display: inline-block;
}

.clear {
    color: rgba(0,0,0,0);
}

.clickable {
    color: blue;
    text-decoration: underline;
    cursor: pointer;
}
</style>