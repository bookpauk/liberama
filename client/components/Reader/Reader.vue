<template>
    <div class="column no-wrap">
        <div v-show="toolBarActive" ref="header" class="header">
            <div ref="buttons" class="row justify-between no-wrap">
                <div>
                    <button ref="loader" v-ripple class="tool-button" :class="buttonActiveClass('loader')" @click="buttonClick('loader')">
                        <q-icon name="la la-arrow-left" size="32px" />
                        <q-tooltip :delay="1500" anchor="bottom right" content-style="font-size: 80%">
                            {{ rstore.readerActions['loader'] }}
                        </q-tooltip>
                    </button>
                </div>

                <div>
                    <button v-show="showToolButton['undoAction']" ref="undoAction" v-ripple class="tool-button" :class="buttonActiveClass('undoAction')" @click="buttonClick('undoAction')">
                        <q-icon name="la la-angle-left" size="32px" />
                        <q-tooltip :delay="1500" anchor="bottom middle" content-style="font-size: 80%">
                            {{ rstore.readerActions['undoAction'] }}
                        </q-tooltip>
                    </button>
                    <button v-show="showToolButton['redoAction']" ref="redoAction" v-ripple class="tool-button" :class="buttonActiveClass('redoAction')" @click="buttonClick('redoAction')">
                        <q-icon name="la la-angle-right" size="32px" />
                        <q-tooltip :delay="1500" anchor="bottom middle" content-style="font-size: 80%">
                            {{ rstore.readerActions['redoAction'] }}
                        </q-tooltip>
                    </button>
                    <div class="space"></div>
                    <button v-show="showToolButton['fullScreen']" ref="fullScreen" v-ripple class="tool-button" :class="buttonActiveClass('fullScreen')" @click="buttonClick('fullScreen')">
                        <q-icon :name="(fullScreenActive ? 'la la-compress-arrows-alt': 'la la-expand-arrows-alt')" size="32px" />
                        <q-tooltip :delay="1500" anchor="bottom middle" content-style="font-size: 80%">
                            {{ rstore.readerActions['fullScreen'] }}
                        </q-tooltip>
                    </button>
                    <button v-show="showToolButton['scrolling']" ref="scrolling" v-ripple class="tool-button" :class="buttonActiveClass('scrolling')" @click="buttonClick('scrolling')">
                        <q-icon name="la la-film" size="32px" />
                        <q-tooltip :delay="1500" anchor="bottom middle" content-style="font-size: 80%">
                            {{ rstore.readerActions['scrolling'] }}
                        </q-tooltip>
                    </button>
                    <button v-show="showToolButton['setPosition']" ref="setPosition" v-ripple class="tool-button" :class="buttonActiveClass('setPosition')" @click="buttonClick('setPosition')">
                        <q-icon name="la la-angle-double-right" size="32px" />
                        <q-tooltip :delay="1500" anchor="bottom middle" content-style="font-size: 80%">
                            {{ rstore.readerActions['setPosition'] }}
                        </q-tooltip>
                    </button>
                    <button v-show="showToolButton['search']" ref="search" v-ripple class="tool-button" :class="buttonActiveClass('search')" @click="buttonClick('search')">
                        <q-icon name="la la-search" size="32px" />
                        <q-tooltip :delay="1500" anchor="bottom middle" content-style="font-size: 80%">
                            {{ rstore.readerActions['search'] }}
                        </q-tooltip>
                    </button>
                    <button v-show="showToolButton['copyText']" ref="copyText" v-ripple class="tool-button" :class="buttonActiveClass('copyText')" @click="buttonClick('copyText')">
                        <q-icon name="la la-copy" size="32px" />
                        <q-tooltip :delay="1500" anchor="bottom middle" content-style="font-size: 80%">
                            {{ rstore.readerActions['copyText'] }}
                        </q-tooltip>
                    </button>
                    <button v-show="showToolButton['convOptions']" ref="convOptions" v-ripple class="tool-button" :class="buttonActiveClass('convOptions')" @click="buttonClick('convOptions')">
                        <q-icon name="la la-magic" size="32px" />
                        <q-tooltip :delay="1500" anchor="bottom middle" content-style="font-size: 80%">
                            {{ rstore.readerActions['convOptions'] }}
                        </q-tooltip>
                    </button>
                    <button v-show="showToolButton['refresh']" ref="refresh" v-ripple class="tool-button" :class="buttonActiveClass('refresh')" @click="buttonClick('refresh')">
                        <q-icon name="la la-sync" size="32px" :class="{clear: !showRefreshIcon}" />
                        <q-tooltip :delay="1500" anchor="bottom middle" content-style="font-size: 80%">
                            {{ rstore.readerActions['refresh'] }}
                        </q-tooltip>
                    </button>
                    <div class="space"></div>
                    <button v-show="showToolButton['contents']" ref="contents" v-ripple class="tool-button" :class="buttonActiveClass('contents')" @click="buttonClick('contents')">
                        <q-icon name="la la-list" size="32px" />
                        <q-tooltip :delay="1500" anchor="bottom middle" content-style="font-size: 80%">
                            {{ rstore.readerActions['contents'] }}
                        </q-tooltip>
                    </button>
                    <button v-show="mode == 'liberama.top' && showToolButton['libs']" ref="libs" v-ripple class="tool-button" :class="buttonActiveClass('libs')" @click="buttonClick('libs')">
                        <q-icon name="la la-sitemap" size="32px" />
                        <q-tooltip :delay="1500" anchor="bottom middle" content-style="font-size: 80%">
                            {{ rstore.readerActions['libs'] }}
                        </q-tooltip>
                    </button>
                    <button v-show="showToolButton['recentBooks']" ref="recentBooks" v-ripple class="tool-button" :class="buttonActiveClass('recentBooks')" @click="buttonClick('recentBooks')">
                        <q-icon name="la la-book-open" size="32px" />
                        <q-tooltip :delay="1500" anchor="bottom middle" content-style="font-size: 80%">
                            {{ rstore.readerActions['recentBooks'] }}
                        </q-tooltip>
                    </button>
                </div>

                <div>
                    <button v-show="showToolButton['offlineMode']" ref="offlineMode" v-ripple class="tool-button" :class="buttonActiveClass('offlineMode')" @click="buttonClick('offlineMode')">
                        <q-icon name="la la-unlink" size="32px" />
                        <q-tooltip :delay="1500" anchor="bottom middle" content-style="font-size: 80%">
                            {{ rstore.readerActions['offlineMode'] }}
                        </q-tooltip>
                    </button>
                    <button ref="settings" v-ripple class="tool-button" :class="buttonActiveClass('settings')" @click="buttonClick('settings')">
                        <q-icon name="la la-cog" size="32px" />
                        <q-tooltip :delay="1500" anchor="bottom left" content-style="font-size: 80%">
                            {{ rstore.readerActions['settings'] }}
                        </q-tooltip>
                    </button>
                </div>
            </div>
        </div>

        <div class="main col row relative-position">
            <keep-alive>
                <component 
                    :is="activePage"
                    ref="page"
                    class="col"
                    @load-book="loadBook"
                    @load-file="loadFile"
                    @book-pos-changed="bookPosChanged"
                    @do-action="doAction"
                ></component>
            </keep-alive>

            <SetPositionPage v-if="setPositionActive" ref="setPositionPage" @set-position-toggle="setPositionToggle" @book-pos-changed="bookPosChanged"></SetPositionPage>
            <SearchPage 
                v-show="searchActive"
                ref="searchPage" 
                @do-action="doAction"
                @book-pos-changed="bookPosChanged"
                @start-text-search="startTextSearch"
                @stop-text-search="stopTextSearch"
            ></SearchPage>
            <CopyTextPage v-if="copyTextActive" ref="copyTextPage" @do-action="doAction"></CopyTextPage>
            <LibsPage v-show="hidden" ref="libsPage" @load-book="loadBook" @libs-close="libsClose" @do-action="doAction"></LibsPage>
            <RecentBooksPage v-show="recentBooksActive" ref="recentBooksPage" @load-book="loadBook" @recent-books-close="recentBooksClose"></RecentBooksPage>
            <SettingsPage v-show="settingsActive" ref="settingsPage" @do-action="doAction"></SettingsPage>
            <HelpPage v-if="helpActive" ref="helpPage" @do-action="doAction"></HelpPage>
            <ClickMapPage v-show="clickMapActive" ref="clickMapPage"></ClickMapPage>
            <ContentsPage v-show="contentsActive" ref="contentsPage" :book-pos="bookPos" :is-visible="contentsActive" @do-action="doAction" @book-pos-changed="bookPosChanged"></ContentsPage>

            <ServerStorage v-show="hidden" ref="serverStorage"></ServerStorage>
            <ReaderDialogs ref="dialogs" @donate-toggle="donateToggle" @version-history-toggle="versionHistoryToggle"></ReaderDialogs>
        </div>
    </div>
</template>

<script>
//-----------------------------------------------------------------------------
import vueComponent from '../vueComponent.js';

import _ from 'lodash';
import {Buffer} from 'safe-buffer';

import LoaderPage from './LoaderPage/LoaderPage.vue';
import TextPage from './TextPage/TextPage.vue';
import ProgressPage from './ProgressPage/ProgressPage.vue';

import SetPositionPage from './SetPositionPage/SetPositionPage.vue';
import SearchPage from './SearchPage/SearchPage.vue';
import CopyTextPage from './CopyTextPage/CopyTextPage.vue';
import LibsPage from './LibsPage/LibsPage.vue';
import RecentBooksPage from './RecentBooksPage/RecentBooksPage.vue';
import SettingsPage from './SettingsPage/SettingsPage.vue';
import HelpPage from './HelpPage/HelpPage.vue';
import ClickMapPage from './ClickMapPage/ClickMapPage.vue';
import ContentsPage from './ContentsPage/ContentsPage.vue';

import ServerStorage from './ServerStorage/ServerStorage.vue';
import ReaderDialogs from './ReaderDialogs/ReaderDialogs.vue';

import bookManager from './share/bookManager';
import wallpaperStorage from './share/wallpaperStorage';
import dynamicCss from '../../share/dynamicCss';

import rstore from '../../store/modules/reader';
import readerApi from '../../api/reader';
import miscApi from '../../api/misc';

import {versionHistory} from './versionHistory';
import * as utils from '../../share/utils';

const componentOptions = {
    components: {
        LoaderPage,
        TextPage,
        ProgressPage,

        SetPositionPage,
        SearchPage,
        CopyTextPage,
        LibsPage,
        RecentBooksPage,
        SettingsPage,
        HelpPage,
        ClickMapPage,
        ContentsPage,

        ServerStorage,
        ReaderDialogs,
    },
    watch: {
        bookPos: function(newValue) {
            if (newValue !== undefined && this.activePage == 'TextPage') {
                const textPage = this.$refs.page;

                if (textPage.bookPos != newValue) {
                    textPage.bookPos = newValue;
                }

                if (!this.scrollingActive)
                    this.debouncedSetRecentBook(newValue);
                else
                    this.scrollingSetRecentBook(newValue);
            }
        },
        routeParamPos: function(newValue) {
            if (!this.paramPosIgnore && newValue !== undefined && newValue != this.bookPos) {
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
            (async() => {
                const recent = this.mostRecentBook();
                if (!newValue && !this.loading && recent && !await bookManager.hasBookParsed(recent)) {
                    this.loadBook(recent);
                }
            })();
        },
        dualPageMode(newValue) {
            if (newValue)
                this.stopScrolling();
        },
    },
};

class Reader {
    _options = componentOptions;

    rstore = {};

    loaderActive = false;
    fullScreenActive = false;
    setPositionActive = false;
    searchActive = false;
    copyTextActive = false;
    convOptionsActive = false;
    refreshActive = false;
    contentsActive = false;    
    libsActive = false;
    recentBooksActive = false;
    offlineModeActive = false;
    settingsActive = false;

    clickMapActive = false;
    helpActive = false;
    scrollingActive = false;
    progressActive = false;

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
    donationVisible = false;
    dualPageMode = false;

    created() {
        this.rstore = rstore;
        this.loading = true;
        this.commit = this.$store.commit;
        this.reader = this.$store.state.reader;
        this.config = this.$store.state.config;

        this.$root.addEventHook('key', this.keyHook);

        this.lastActivePage = false;

        this.$watch(
            () => this.$route.path,
            (newValue) => {
                if (newValue == '/reader') {
                    this.updateRoute();
                }
            }
        );

        this.debouncedSetRecentBook = _.debounce(async(newValue) => {
            const recent = this.mostRecentBook();
            if (recent && (recent.bookPos != newValue || recent.bookPosSeen !== this.bookPosSeen)) {
                await bookManager.setRecentBook(Object.assign({}, recent, {bookPos: newValue, bookPosSeen: this.bookPosSeen}));

                if (this.actionCur < 0 || (this.actionCur >= 0 && this.actionList[this.actionCur] != newValue))
                    this.addAction(newValue);

                this.paramPosIgnore = true;
                this.updateRoute();
                await this.$nextTick();
                this.paramPosIgnore = false;
            }
        }, 500, {maxWait: 5000});

        this.scrollingSetRecentBook = _.debounce((newValue) => {
            this.debouncedSetRecentBook(newValue);
        }, 15000, {maxWait: 20000});

        document.addEventListener('fullscreenchange', () => {
            this.fullScreenActive = (document.fullscreenElement !== null);
        });

        this.loadSettings();
    }

    mounted() {
        this.updateHeaderMinWidth();

        (async() => {
            await wallpaperStorage.init();
            await bookManager.init(this.settings);
            bookManager.addEventListener(this.bookManagerEvent);

            if (this.$root.getRootRoute() == '/reader') {
                if (this.routeParamUrl) {
                    await this.loadBook({url: this.routeParamUrl, bookPos: this.routeParamPos, force: this.routeParamRefresh});
                } else {
                    this.loaderActive = true;
                }
            }

            await this.$refs.serverStorage.init();
            this.checkSetStorageAccessKey();
            this.checkActivateDonateHelpPage();
            this.loading = false;

            //проверим состояние Settings, и обновим, если надо
            const newSettings = rstore.addDefaultsToSettings(this.settings);
            if (newSettings) {
                this.commit('reader/setSettings', newSettings);
            }

            this.updateRoute();

            await this.$refs.dialogs.init();
        })();

        (async() => {
            this.isFirstNeedUpdateNotify = true;
            //вечный цикл, запрашиваем периодически конфиг для проверки выхода новой версии читалки
            while (true) {// eslint-disable-line no-constant-condition
                await this.checkNewVersionAvailable();
                await utils.sleep(3600*1000); //каждый час
            }
            //дальше кода нет
        })();
    }

    loadSettings() {
        const settings = this.settings;
        this.allowUrlParamBookPos = settings.allowUrlParamBookPos;
        this.copyFullText = settings.copyFullText;
        this.showClickMapPage = settings.showClickMapPage;
        this.clickControl = settings.clickControl;
        this.blinkCachedLoad = settings.blinkCachedLoad;
        this.showToolButton = settings.showToolButton;
        this.enableSitesFilter = settings.enableSitesFilter;
        this.showNeedUpdateNotify = settings.showNeedUpdateNotify;
        this.splitToPara = settings.splitToPara;
        this.djvuQuality = settings.djvuQuality;
        this.pdfAsText = settings.pdfAsText;
        this.pdfQuality = settings.pdfQuality;
        this.dualPageMode = settings.dualPageMode;
        this.userWallpapers = settings.userWallpapers;

        this.readerActionByKeyCode = utils.userHotKeysObjectSwap(settings.userHotKeys);
        this.$root.readerActionByKeyEvent = (event) => {
            return this.readerActionByKeyCode[utils.keyEventToCode(event)];
        }

        this.updateHeaderMinWidth();
        
        this.loadWallpapers();//no await
    }

    //wallpaper css
    async loadWallpapers() {
        const wallpaperDataLength = await wallpaperStorage.getLength();
        if (wallpaperDataLength !== this.wallpaperDataLength) {//оптимизация
            this.wallpaperDataLength = wallpaperDataLength;

            let newCss = '';
            for (const wp of this.userWallpapers) {
                const data = await wallpaperStorage.getData(wp.cssClass);

                if (!data) {
                    //здесь будем восстанавливать данные с сервера
                }

                if (data) {
                    newCss += `.${wp.cssClass} {background: url(${data}) center; background-size: 100% 100%;}`;                
                }
            }
            dynamicCss.replace('wallpapers', newCss);
        }
    }

    async checkNewVersionAvailable() {
        if (!this.checkingNewVersion && this.showNeedUpdateNotify) {
            this.checkingNewVersion = true;
            try {
                await utils.sleep(15*1000); //подождем 15 секунд, чтобы прогрузился ServiceWorker при выходе новой версии
                const config = await miscApi.loadConfig();
                this.commit('config/setConfig', config);

                let againMes = '';
                if (this.isFirstNeedUpdateNotify) {
                    againMes = ' еще один раз';
                }

                if (this.version != this.clientVersion)
                    this.$root.notify.info(`Вышла новая версия (v${this.version}) читалки.<br>Пожалуйста, обновите страницу${againMes}.`, 'Обновление');
            } catch(e) {
                console.error(e);
            } finally {
                this.checkingNewVersion = false;
            }        
            this.isFirstNeedUpdateNotify = false;
        }
    }

    updateHeaderMinWidth() {
        const showButtonCount = Object.values(this.showToolButton).reduce((a, b) => a + (b ? 1 : 0), 0);
        if (this.$refs.buttons)
            this.$refs.buttons.style.minWidth = 65*showButtonCount + 'px';
        (async() => {
            await utils.sleep(1000);
            if (this.$refs.header)
                this.$refs.header.style.overflowX = 'auto';
        })();
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

    checkBookPosPercent() {
        const q = this.$route.query;
        if (q['__pp']) {
            let pp = q['__pp'];
            if (pp) {
                pp = parseFloat(pp) || 0;
                const recent = this.mostRecentBook();
                (async() => {
                    await utils.sleep(100);
                    this.bookPos = Math.floor(recent.textLength*pp/100);
                })();
            }
        }
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
            this.$router.push(`/reader?${pos}${url}`).catch(() => {});
        else
            this.$router.replace(`/reader?${pos}${url}`).catch(() => {});

    }

    get mode() {
        return this.$store.state.config.mode;
    }

    get version() {
        return this.$store.state.config.version;
    }

    get clientVersion() {
        let v = versionHistory[0].header;
        v = v.split(' ')[0];
        return v;
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

    get routeParamRefresh() {
        const q = this.$route.query;
        return !!q['__refresh'];
    }

    bookPosChanged(event) {
        if (event.bookPosSeen !== undefined)
            this.bookPosSeen = event.bookPosSeen;
        this.bookPos = event.bookPos;
    }

    async bookManagerEvent(eventName, value) {
        if (eventName == 'set-recent' || eventName == 'recent-deleted') {
            const oldBook = (this.textPage ? this.textPage.lastBook : null);
            const oldPos = (this.textPage ? this.textPage.bookPos : null);
            const newBook = bookManager.mostRecentBook();

            if (!(oldBook && newBook && oldBook.key == newBook.key)) {
                this.mostRecentBook();
            }

            if (oldBook && newBook) {
                if (oldBook.key != newBook.key || oldBook.path != newBook.path) {
                    this.loadingBook = true;
                    try {
                        await this.loadBook(newBook);
                    } finally {
                        this.loadingBook = false;
                    }
                } else if (oldPos != newBook.bookPos) {
                    while (this.loadingBook) await utils.sleep(100);
                    this.bookPosChanged({bookPos: newBook.bookPos});
                }
            }
        }

        if (eventName == 'recent-changed') {
            if (this.recentBooksActive) {
                await this.$refs.recentBooksPage.updateTableData();
            }

            //сохранение в serverStorage
            if (value) {
                await utils.sleep(500);
                await this.$refs.serverStorage.saveRecent(value);
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
        this.$root.eventHook('resize');
    }

    fullScreenToggle() {
        this.fullScreenActive = !this.fullScreenActive;
        if (this.fullScreenActive) {
            this.$q.fullscreen.request();
        } else {
            this.$q.fullscreen.exit();
        }
    }

    closeAllWindows() {
        this.setPositionActive = false;
        this.copyTextActive = false;
        this.recentBooksActive = false;
        this.settingsActive = false;
        this.stopScrolling();
        this.stopSearch();
        this.helpActive = false;
        this.contentsActive = false;
    }

    loaderToggle() {
        this.loaderActive = !this.loaderActive;
        if (this.loaderActive) {
            this.closeAllWindows();
        }
    }

    setPositionToggle() {
        this.setPositionActive = !this.setPositionActive;
        const page = this.$refs.page;
        if (this.setPositionActive && this.activePage == 'TextPage' && page.parsed) {
            this.closeAllWindows();
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

        if (!this.scrollingActive) {
            this.scrollingSetRecentBook.flush();
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
            this.closeAllWindows();
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
            this.closeAllWindows();
            this.copyTextActive = true;

            this.$nextTick(() => {
                this.$refs.copyTextPage.init(this.mostRecentBook().bookPos, page.parsed, this.copyFullText);
            });
        } else {
            this.copyTextActive = false;
        }
    }

    recentBooksClose() {
        this.recentBooksActive = false;
    }

    recentBooksToggle() {
        this.recentBooksActive = !this.recentBooksActive;
        if (this.recentBooksActive) {
            this.closeAllWindows();
            this.$refs.recentBooksPage.init();
            this.recentBooksActive = true;
        } else {
            this.recentBooksActive = false;
        }
    }

    contentsPageToggle() {
        this.contentsActive = !this.contentsActive;
        const page = this.$refs.page;
        if (this.contentsActive && this.activePage == 'TextPage' && page.parsed) {
            this.closeAllWindows();
            this.contentsActive = true;

            this.$nextTick(() => {
                this.$refs.contentsPage.init(this.mostRecentBook(), page.parsed);
            });
        } else {
            this.contentsActive = false;
        }
    }

    libsClose() {
        if (this.libsActive)
            this.libsToogle();
    }

    libsToogle() {
        this.libsActive = !this.libsActive;
        if (this.libsActive) {
            this.$refs.libsPage.init();
        } else {
            this.$refs.libsPage.done();
        }
    }

    offlineModeToggle() {
        this.offlineModeActive = !this.offlineModeActive;
        this.$refs.serverStorage.offlineModeActive = this.offlineModeActive;
    }

    settingsToggle() {
        this.settingsActive = !this.settingsActive;
        if (this.settingsActive) {
            this.closeAllWindows();
            this.settingsActive = true;

            this.$nextTick(() => {
                this.$refs.settingsPage.init();
            });
        } else {
            this.settingsActive = false;
        }
    }

    convOptionsToggle() {
        this.settingsToggle();
        if (this.settingsActive)
            this.$refs.settingsPage.selectedTab = 'convert';
    }

    helpToggle() {
        this.helpActive = !this.helpActive;
        if (this.helpActive) {
            this.closeAllWindows();
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
        const mrb = this.mostRecentBook();
        this.loadBook({url: mrb.url, uploadFileName: mrb.uploadFileName, force: true});
    }

    undoAction() {
        if (this.actionCur > 0) {
            this.actionCur--;
            this.bookPosChanged({bookPos: this.actionList[this.actionCur]});
        }
    }

    redoAction() {
        if (this.actionCur < this.actionList.length - 1) {
            this.actionCur++;
            this.bookPosChanged({bookPos: this.actionList[this.actionCur]});
        }
    }

    buttonClick(action) {
        const activeClass = this.buttonActiveClass(action);

        this.$refs[action].blur();

        if (activeClass['tool-button-disabled'])
            return;
        
        this.doAction({action});
    }

    buttonActiveClass(action) {
        const classActive = { 'tool-button-active': true, 'tool-button-active:hover': true };
        const classDisabled = { 'tool-button-disabled': true, 'tool-button-disabled:hover': true };
        let classResult = {};

        switch (action) {
            case 'loader':
            case 'fullScreen':
            case 'setPosition':
            case 'search':
            case 'copyText':
            case 'convOptions':
            case 'refresh':
            case 'contents':
            case 'libs':
            case 'recentBooks':
            case 'offlineMode':
            case 'settings':
                if (this.progressActive) {
                    classResult = classDisabled;
                } else if (this[`${action}Active`]) {
                    classResult = classActive;
                }
                break;
            case 'scrolling':
                if (this.progressActive || this.dualPageMode) {
                    classResult = classDisabled;
                } else if (this[`${action}Active`]) {
                    classResult = classActive;
                }
                break;
            case 'undoAction':
                if (this.actionCur <= 0)
                    classResult = classDisabled;
                break;
            case 'redoAction':
                if (this.actionCur == this.actionList.length - 1)
                    classResult = classDisabled;
                break;
        }

        if (this.activePage == 'LoaderPage' || !this.mostRecentBookReactive) {
            switch (action) {
                case 'undoAction':
                case 'redoAction':
                case 'setPosition':
                case 'scrolling':
                case 'search':
                case 'copyText':
                case 'contents':
                    classResult = classDisabled;
                    break;
                case 'refresh':
                case 'recentBooks':
                    if (!this.mostRecentBookReactive)
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
        let result = undefined;

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
            this.$root.setAppTitle();
        }

        // на LoaderPage всегда показываем toolBar
        if (result == 'LoaderPage' && !this.toolBarActive) {
            this.toolBarToggle();
        }

        if (this.lastActivePage != result && result == 'TextPage') {
            //акивируем страницу с текстом
            this.$nextTick(async() => {
                const last = this.mostRecentBookReactive;
                const isParsed = await bookManager.hasBookParsed(last);

                if (!isParsed) {
                    this.$root.setAppTitle();
                    return;
                }

                this.updateRoute();
                const textPage = this.$refs.page;
                if (textPage.showBook) {
                    this.textPage = textPage;
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

        this.closeAllWindows();

        let url = encodeURI(decodeURI(opts.url));

        //TODO: убрать конвертирование 'file://' после 06.2021
        if (url.length == 71 && url.indexOf('file://') == 0)
            url = url.replace(/^file/, 'disk');

        if ((url.indexOf('http://') != 0) && (url.indexOf('https://') != 0) &&
            (url.indexOf('disk://') != 0))
            url = 'http://' + url;

        // уже просматривается сейчас
        const lastBook = (this.textPage ? this.textPage.lastBook : null);
        if (!opts.force && lastBook && lastBook.url == url && 
                (!opts.path || opts.path == lastBook.path) && 
                await bookManager.hasBookParsed(lastBook)) {
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
            const uploadFileName = (opts.uploadFileName ? opts.uploadFileName : '');

            let book = null;

            if (!opts.force) {
                // пытаемся загрузить и распарсить книгу в менеджере из локального кэша
                const bookParsed = await bookManager.getBook({url, path: opts.path}, (prog) => {
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

                    this.checkBookPosPercent();
                    await this.activateClickMapPage();
                    return;
                }

                // иначе идем на сервер
                // пытаемся загрузить готовый файл с сервера
                if (wasOpened.path) {
                    progress.setState({totalSteps: 5});
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
                book = await readerApi.loadBook({
                        url,
                        uploadFileName,
                        enableSitesFilter: this.enableSitesFilter,
                        skipHtmlCheck: (this.splitToPara ? true : false),
                        isText: (this.splitToPara ? true : false),
                        djvuQuality: this.djvuQuality,
                        pdfAsText: this.pdfAsText,
                        pdfQuality: this.pdfQuality,
                    },
                    (state) => {
                        progress.setState(state);
                    }
                );
                loadCached = false;
            }

            // добавляем в bookManager
            progress.setState({state: 'parse', step: 5});
            const addedBook = await bookManager.addBook(book, (prog) => {
                progress.setState({progress: prog});
            });

            // добавляем в историю
            await bookManager.setRecentBook(Object.assign({bookPos, bookPosSeen, uploadFileName}, addedBook));
            this.mostRecentBook();
            this.addAction(bookPos);
            this.updateRoute(true);

            this.loaderActive = false;
            progress.hide(); this.progressActive = false;
            if (loadCached) {
                this.blinkCachedLoadMessage();
            } else
                this.stopBlink = true;

            this.checkBookPosPercent();
            await this.activateClickMapPage();
        } catch (e) {
            progress.hide(); this.progressActive = false;
            this.loaderActive = true;
            this.$root.stdDialog.alert(e.message, 'Ошибка', {color: 'negative'});
        } finally {
            this.checkNewVersionAvailable();
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

            await this.loadBook({url, uploadFileName: opts.file.name, force: true});
        } catch (e) {
            progress.hide(); this.progressActive = false;
            this.loaderActive = true;
            this.$root.stdDialog.alert(e.message, 'Ошибка', {color: 'negative'});
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
                    if (page && page.blinkCachedLoadMessage)
                        page.blinkCachedLoadMessage(this.showRefreshIcon);
                    await utils.sleep(500);
                    if (this.stopBlink)
                        break;
                    this.blinkCount--;
                    page = this.$refs.page;
                }
                this.showRefreshIcon = true;
                this.inBlink = false;
                if (page && page.blinkCachedLoadMessage)
                    page.blinkCachedLoadMessage('finish');
            });
        }
    }

    doAction(opts) {
        let result = true;
        let {action = '', event = false} = opts;

        switch (action) {
            case 'loader':
                this.loaderToggle();
                break;
            case 'help':
                this.helpToggle();
                break;
            case 'undoAction':
                this.undoAction();
                break;
            case 'redoAction':
                this.redoAction();
                break;
            case 'fullScreen':
                this.fullScreenToggle();
                break;
            case 'scrolling':
                this.scrollingToggle();
                break;
            case 'stopScrolling':
                this.stopScrolling();
                break;
            case 'setPosition':
                this.setPositionToggle();
                break;
            case 'search':
                this.searchToggle();
                break;
            case 'copyText':
                this.copyTextToggle();
                break;
            case 'convOptions':
                this.convOptionsToggle();
                break;
            case 'refresh':
                this.refreshBook();
                break;
            case 'contents':
                this.contentsPageToggle();
                break;
            case 'libs':
                this.libsToogle();
                break;
            case 'recentBooks':
                this.recentBooksToggle();
                break;
            case 'offlineMode':
                this.offlineModeToggle();
                break;
            case 'settings':
                this.settingsToggle();
                break;
            case 'switchToolbar':
                this.toolBarToggle();
                break;
            case 'donate':
                this.donateToggle();
                break;
            default:
                result = false;
                break;
        }

        if (!result && this.activePage == 'TextPage' && this.$refs.page) {
            result = true;
            const textPage = this.$refs.page;

            switch (action) {
                case 'bookBegin':
                    textPage.doHome();
                    break;
                case 'bookEnd':
                    textPage.doEnd();
                    break;
                case 'pageBack':
                    textPage.doPageUp();
                    break;
                case 'pageForward':
                    textPage.doPageDown();
                    break;
                case 'lineBack':
                    textPage.doUp();
                    break;
                case 'lineForward':
                    textPage.doDown();
                    break;
                case 'incFontSize':
                    textPage.doFontSizeInc();
                    break;
                case 'decFontSize':
                    textPage.doFontSizeDec();
                    break;
                case 'scrollingSpeedUp':
                    textPage.doScrollingSpeedUp();
                    break;
                case 'scrollingSpeedDown':
                    textPage.doScrollingSpeedDown();
                    break;
                default:
                    result = false;
                    break;
            }
        }

        if (result && event) {
            event.preventDefault();
            event.stopPropagation();
        }

        return result;
    }

    keyHook(event) {
        let result = false;
        if (this.$root.getRootRoute() == '/reader') {
            if (this.$root.stdDialog.active)
                return result;

            if (!result)
                result = this.$refs.dialogs.keyHook(event);

            if (!result && this.helpActive)
                result = this.$refs.helpPage.keyHook(event);

            if (!result && this.settingsActive)
                result = this.$refs.settingsPage.keyHook(event);

            if (!result && this.recentBooksActive)
                result = this.$refs.recentBooksPage.keyHook(event);

            if (!result && this.setPositionActive)
                result = this.$refs.setPositionPage.keyHook(event);

            if (!result && this.searchActive)
                result = this.$refs.searchPage.keyHook(event);

            if (!result && this.copyTextActive)
                result = this.$refs.copyTextPage.keyHook(event);

            if (!result && this.contentsActive)
                result = this.$refs.contentsPage.keyHook(event);

            if (!result && this.$refs.page && this.$refs.page.keyHook)
                result = this.$refs.page.keyHook(event);

            if (!result && event.type == 'keydown') {
                const action = this.$root.readerActionByKeyEvent(event);

                if (action == 'loader') {
                    result = this.doAction({action, event});
                }

                if (!result && this.activePage == 'TextPage') {
                    result = this.doAction({action, event});
                }
            }
        }
        return result;
    }
}

export default vueComponent(Reader);
//-----------------------------------------------------------------------------
</script>

<style scoped>
.header {
    padding-left: 5px;
    padding-right: 5px;
    background-color: #1B695F;
    color: #000;
    overflow: hidden;
    height: 50px;
}

.main {
    background-color: #EBE2C9;
    color: #000;
}

.tool-button {
    margin: 0px 2px 0 2px;
    padding: 0;
    color: #3E843E;
    background-color: #E6EDF4;
    margin-top: 5px;
    height: 38px;
    width: 38px;
    border: 0;
    border-radius: 6px;
    box-shadow: 3px 3px 5px black;
    outline: 0;
}

.tool-button:hover {
    background-color: white;
    cursor: pointer;
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
    cursor: pointer;
}

.tool-button-disabled {
    color: lightgray;
    background-color: gray;
    cursor: default;
}

.tool-button-disabled:hover {
    color: lightgray;
    background-color: gray;
    cursor: default;
}

.space {
    width: 10px;
    display: inline-block;
}

.clear {
    color: rgba(0,0,0,0);
}
</style>
