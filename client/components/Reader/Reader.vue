<template>
    <div class="column no-wrap">
        <div ref="header" class="header" v-show="toolBarActive">
            <div ref="buttons" class="row justify-between no-wrap">
                <button ref="loader" class="tool-button" :class="buttonActiveClass('loader')" @click="buttonClick('loader')" v-ripple>
                    <q-icon name="la la-arrow-left" size="32px"/>
                    <q-tooltip :delay="1500" anchor="bottom right" content-style="font-size: 80%">{{ rstore.readerActions['loader'] }}</q-tooltip>
                </button>

                <div>
                    <button ref="undoAction" v-show="showToolButton['undoAction']" class="tool-button" :class="buttonActiveClass('undoAction')" @click="buttonClick('undoAction')" v-ripple>
                        <q-icon name="la la-angle-left" size="32px"/>
                        <q-tooltip :delay="1500" anchor="bottom middle" content-style="font-size: 80%">{{ rstore.readerActions['undoAction'] }}</q-tooltip>
                    </button>
                    <button ref="redoAction" v-show="showToolButton['redoAction']" class="tool-button" :class="buttonActiveClass('redoAction')" @click="buttonClick('redoAction')" v-ripple>
                        <q-icon name="la la-angle-right" size="32px"/>
                        <q-tooltip :delay="1500" anchor="bottom middle" content-style="font-size: 80%">{{ rstore.readerActions['redoAction'] }}</q-tooltip>
                    </button>
                    <div class="space"></div>
                    <button ref="fullScreen" v-show="showToolButton['fullScreen']" class="tool-button" :class="buttonActiveClass('fullScreen')" @click="buttonClick('fullScreen')" v-ripple>
                        <q-icon :name="(fullScreenActive ? 'la la-compress-arrows-alt': 'la la-expand-arrows-alt')" size="32px"/>
                        <q-tooltip :delay="1500" anchor="bottom middle" content-style="font-size: 80%">{{ rstore.readerActions['fullScreen'] }}</q-tooltip>
                    </button>
                    <button ref="scrolling" v-show="showToolButton['scrolling']" class="tool-button" :class="buttonActiveClass('scrolling')" @click="buttonClick('scrolling')" v-ripple>
                        <q-icon name="la la-film" size="32px"/>
                        <q-tooltip :delay="1500" anchor="bottom middle" content-style="font-size: 80%">{{ rstore.readerActions['scrolling'] }}</q-tooltip>
                    </button>
                    <button ref="setPosition" v-show="showToolButton['setPosition']" class="tool-button" :class="buttonActiveClass('setPosition')" @click="buttonClick('setPosition')" v-ripple>
                        <q-icon name="la la-angle-double-right" size="32px"/>
                        <q-tooltip :delay="1500" anchor="bottom middle" content-style="font-size: 80%">{{ rstore.readerActions['setPosition'] }}</q-tooltip>
                    </button>
                    <button ref="search" v-show="showToolButton['search']" class="tool-button" :class="buttonActiveClass('search')" @click="buttonClick('search')" v-ripple>
                        <q-icon name="la la-search" size="32px"/>
                        <q-tooltip :delay="1500" anchor="bottom middle" content-style="font-size: 80%">{{ rstore.readerActions['search'] }}</q-tooltip>
                    </button>
                    <button ref="copyText" v-show="showToolButton['copyText']" class="tool-button" :class="buttonActiveClass('copyText')" @click="buttonClick('copyText')" v-ripple>
                        <q-icon name="la la-copy" size="32px"/>
                        <q-tooltip :delay="1500" anchor="bottom middle" content-style="font-size: 80%">{{ rstore.readerActions['copyText'] }}</q-tooltip>
                    </button>
                    <button ref="refresh" v-show="showToolButton['refresh']" class="tool-button" :class="buttonActiveClass('refresh')" @click="buttonClick('refresh')" v-ripple>
                        <q-icon name="la la-sync" size="32px" :class="{clear: !showRefreshIcon}"/>
                        <q-tooltip :delay="1500" anchor="bottom middle" content-style="font-size: 80%">{{ rstore.readerActions['refresh'] }}</q-tooltip>
                    </button>
                    <div class="space"></div>
                    <button ref="offlineMode" v-show="showToolButton['offlineMode']" class="tool-button" :class="buttonActiveClass('offlineMode')" @click="buttonClick('offlineMode')" v-ripple>
                        <q-icon name="la la-unlink" size="32px"/>
                        <q-tooltip :delay="1500" anchor="bottom middle" content-style="font-size: 80%">{{ rstore.readerActions['offlineMode'] }}</q-tooltip>
                    </button>
                    <button ref="recentBooks" v-show="showToolButton['recentBooks']" class="tool-button" :class="buttonActiveClass('recentBooks')" @click="buttonClick('recentBooks')" v-ripple>
                        <q-icon name="la la-book-open" size="32px"/>
                        <q-tooltip :delay="1500" anchor="bottom middle" content-style="font-size: 80%">{{ rstore.readerActions['recentBooks'] }}</q-tooltip>
                    </button>
                </div>

                <button ref="settings" class="tool-button" :class="buttonActiveClass('settings')" @click="buttonClick('settings')" v-ripple>
                    <q-icon name="la la-cog" size="32px"/>
                    <q-tooltip :delay="1500" anchor="bottom left" content-style="font-size: 80%">{{ rstore.readerActions['settings'] }}</q-tooltip>
                </button>
            </div>
        </div>

        <div class="main col row relative-position">
            <keep-alive>
                <component ref="page" class="col" :is="activePage"
                    @load-book="loadBook"
                    @load-file="loadFile"
                    @book-pos-changed="bookPosChanged"
                    @do-action="doAction"

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
                @do-action="doAction"
                @search-toggle="searchToggle" 
                @book-pos-changed="bookPosChanged"
                @start-text-search="startTextSearch"
                @stop-text-search="stopTextSearch">
            </SearchPage>
            <CopyTextPage v-if="copyTextActive" ref="copyTextPage" @copy-text-toggle="copyTextToggle"></CopyTextPage>
            <RecentBooksPage v-show="recentBooksActive" ref="recentBooksPage" @load-book="loadBook" @recent-books-close="recentBooksClose"></RecentBooksPage>
            <SettingsPage v-show="settingsActive" ref="settingsPage" @settings-toggle="settingsToggle"></SettingsPage>
            <HelpPage v-if="helpActive" ref="helpPage" @help-toggle="helpToggle"></HelpPage>
            <ClickMapPage v-show="clickMapActive" ref="clickMapPage"></ClickMapPage>
            <ServerStorage v-show="hidden" ref="serverStorage"></ServerStorage>

            <Dialog ref="dialog1" v-model="whatsNewVisible">
                <template slot="header">
                    Что нового:
                </template>

                <div style="line-height: 20px" v-html="whatsNewContent"></div>

                <span class="clickable" @click="openVersionHistory">Посмотреть историю версий</span>
                <span slot="footer">
                    <q-btn class="q-px-md" dense no-caps @click="whatsNewDisable">Больше не показывать</q-btn>
                </span>
            </Dialog>

            <Dialog ref="dialog2" v-model="donationVisible">
                <template slot="header">
                    Здравствуйте, уважаемые читатели!
                </template>

                <div style="word-break: normal">
                    Стартовала ежегодная акция "Оплатим хостинг вместе".<br><br>

                    Для оплаты годового хостинга читалки, необходимо собрать около 2000 рублей.
                    В настоящий момент у автора эта сумма есть в наличии. Однако будет справедливо, если каждый
                    сможет проголосовать рублем за то, чтобы читалка так и оставалась:

                    <ul>
                        <li>непрерывно улучшаемой</li>
                        <li>без рекламы</li>
                        <li>без регистрации</li>
                        <li>Open Source</li>
                    </ul>

                    Автор также обращается с просьбой о помощи в распространении 
                    <a href="https://omnireader.ru" target="_blank">ссылки</a>
                    <q-icon class="copy-icon" name="la la-copy" @click="copyLink('https://omnireader.ru')">
                        <q-tooltip :delay="1000" anchor="top middle" self="center middle" content-style="font-size: 80%">Скопировать</q-tooltip>                    
                    </q-icon>
                    на читалку через тематические форумы, соцсети, мессенджеры и пр.
                    Чем нас больше, тем легче оставаться на плаву и тем больше мотивации у разработчика, чтобы продолжать работать над проектом.

                    <br><br>
                    Если соберется бóльшая сумма, то разработка децентрализованной библиотеки для свободного обмена книгами будет по возможности ускорена.
                    <br><br>
                    P.S. При необходимости можно воспользоваться подходящим обменником на <a href="https://www.bestchange.ru" target="_blank">bestchange.ru</a>

                    <br><br>
                    <div class="row justify-center">
                        <q-btn class="q-px-sm" color="primary" dense no-caps rounded @click="openDonate">Помочь проекту</q-btn>
                    </div>
                </div>

                <span slot="footer">
                    <span class="clickable row justify-end" style="font-size: 60%; color: grey" @click="donationDialogDisable">Больше не показывать</span>                        
                    <br>
                    <q-btn class="q-px-sm" dense no-caps @click="donationDialogRemind">Напомнить позже</q-btn>
                </span>
            </Dialog>

        </div>
    </div>
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
import RecentBooksPage from './RecentBooksPage/RecentBooksPage.vue';
import SettingsPage from './SettingsPage/SettingsPage.vue';
import HelpPage from './HelpPage/HelpPage.vue';
import ClickMapPage from './ClickMapPage/ClickMapPage.vue';
import ServerStorage from './ServerStorage/ServerStorage.vue';
import Dialog from '../share/Dialog.vue';

import bookManager from './share/bookManager';
import rstore from '../../store/modules/reader';
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
        RecentBooksPage,
        SettingsPage,
        HelpPage,
        ClickMapPage,
        ServerStorage,
        Dialog,
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
    },
})
class Reader extends Vue {
    rstore = {};
    loaderActive = false;
    progressActive = false;
    fullScreenActive = false;

    scrollingActive = false;
    setPositionActive = false;
    searchActive = false;
    copyTextActive = false;
    recentBooksActive = false;
    offlineModeActive = false;
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
    donationVisible = false;

    created() {
        this.rstore = rstore;
        this.loading = true;
        this.commit = this.$store.commit;
        this.dispatch = this.$store.dispatch;
        this.reader = this.$store.state.reader;
        this.config = this.$store.state.config;

        this.$root.addKeyHook(this.keyHook);

        this.lastActivePage = false;

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
        }, 500, {'maxWait':5000});

        this.scrollingSetRecentBook = _.debounce((newValue) => {
            this.debouncedSetRecentBook(newValue);
        }, 15000, {'maxWait':20000});

        document.addEventListener('fullscreenchange', () => {
            this.fullScreenActive = (document.fullscreenElement !== null);
        });

        this.loadSettings();
    }

    mounted() {
        this.updateHeaderMinWidth();

        (async() => {
            await bookManager.init(this.settings);
            bookManager.addEventListener(this.bookManagerEvent);

            if (this.$root.rootRoute() == '/reader') {
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

            this.updateRoute();

            await this.showWhatsNew();
            await this.showDonation();
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
        this.showDonationDialog2020 = settings.showDonationDialog2020;
        this.showToolButton = settings.showToolButton;
        this.enableSitesFilter = settings.enableSitesFilter;

        this.readerActionByKeyCode = utils.userHotKeysObjectSwap(settings.userHotKeys);
        this.$root.readerActionByKeyEvent = (event) => {
            return this.readerActionByKeyCode[utils.keyEventToCode(event)];
        }

        this.updateHeaderMinWidth();
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

    async showDonation() {
        await utils.sleep(3000);
        const today = utils.formatDate(new Date(), 'coDate');

        if (this.mode == 'omnireader' && today < '2020-03-01' && this.showDonationDialog2020 && this.donationRemindDate != today) {
            this.donationVisible = true;
        }
    }

    donationDialogDisable() {
        this.donationVisible = false;
        if (this.showDonationDialog2020) {
            const newSettings = Object.assign({}, this.settings, { showDonationDialog2020: false });
            this.commit('reader/setSettings', newSettings);
        }
    }

    donationDialogRemind() {
        this.donationVisible = false;
        this.commit('reader/setDonationRemindDate', utils.formatDate(new Date(), 'coDate'));
    }

    openDonate() {
        this.donationVisible = false;
        this.donateToggle();
    }

    async copyLink(link) {
        const result = await utils.copyTextToClipboard(link);
        if (result)
            this.$root.notify.success(`Ссылка ${link} успешно скопирована в буфер обмена`);
        else
            this.$root.notify.error('Копирование не удалось');
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
            this.$router.push(`/reader?${pos}${url}`).catch(() => {});
        else
            this.$router.replace(`/reader?${pos}${url}`).catch(() => {});

    }

    get mode() {
        return this.$store.state.config.mode;
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

    get whatsNewContentHash() {
        return this.$store.state.reader.whatsNewContentHash;
    }

    get donationRemindDate() {
        return this.$store.state.reader.donationRemindDate;
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
            this.$q.fullscreen.request();
        } else {
            this.$q.fullscreen.exit();
        }
    }

    closeAllTextPages() {
        this.setPositionActive = false;
        this.copyTextActive = false;
        this.recentBooksActive = false;
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
        const page = this.$refs.page;
        if (this.setPositionActive && this.activePage == 'TextPage' && page.parsed) {
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

    recentBooksClose() {
        this.recentBooksActive = false;
    }

    recentBooksToggle() {
        this.recentBooksActive = !this.recentBooksActive;
        if (this.recentBooksActive) {
            this.closeAllTextPages();
            this.$refs.recentBooksPage.init();
            this.recentBooksActive = true;
        } else {
            this.recentBooksActive = false;
        }
    }

    offlineModeToggle() {
        this.offlineModeActive = !this.offlineModeActive;
        this.$refs.serverStorage.offlineModeActive = this.offlineModeActive;
    }

    settingsToggle() {
        this.settingsActive = !this.settingsActive;
        if (this.settingsActive) {
            this.closeAllTextPages();
            this.settingsActive = true;

            this.$nextTick(() => {
                this.$refs.settingsPage.init();
            });
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
            case 'scrolling':
            case 'search':
            case 'copyText':
            case 'refresh':
            case 'offlineMode':
            case 'recentBooks':
            case 'settings':
                if (this.progressActive) {
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
                    classResult = classDisabled;
                    break;
                case 'recentBooks':
                case 'refresh':
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
                const isParsed = await bookManager.hasBookParsed(last);

                if (!isParsed) {
                    this.$root.$emit('set-app-title');
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

        this.closeAllTextPages();

        let url = encodeURI(decodeURI(opts.url));

        if ((url.indexOf('http://') != 0) && (url.indexOf('https://') != 0) &&
            (url.indexOf('file://') != 0))
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
                book = await readerApi.loadBook({url, enableSitesFilter: this.enableSitesFilter}, (state) => {
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

            this.checkBookPosPercent();
            await this.activateClickMapPage();
        } catch (e) {
            progress.hide(); this.progressActive = false;
            this.loaderActive = true;
            this.$root.stdDialog.alert(e.message, 'Ошибка', {color: 'negative'});
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
            case 'settings':
                this.settingsToggle();
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
            case 'refresh':
                this.refreshBook();
                break;
            case 'offlineMode':
                this.offlineModeToggle();
                break;
            case 'recentBooks':
                this.recentBooksToggle();
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
        if (this.$root.rootRoute() == '/reader') {
            if (this.$root.stdDialog.active || this.$refs.dialog1.active || this.$refs.dialog2.active)
                return result;

            let handled = false;
            if (!handled && this.helpActive)
                handled = this.$refs.helpPage.keyHook(event);

            if (!handled && this.settingsActive)
                handled = this.$refs.settingsPage.keyHook(event);

            if (!handled && this.recentBooksActive)
                handled = this.$refs.recentBooksPage.keyHook(event);

            if (!handled && this.setPositionActive)
                handled = this.$refs.setPositionPage.keyHook(event);

            if (!handled && this.searchActive)
                handled = this.$refs.searchPage.keyHook(event);

            if (!handled && this.copyTextActive)
                handled = this.$refs.copyTextPage.keyHook(event);

            if (!handled && this.$refs.page && this.$refs.page.keyHook)
                handled = this.$refs.page.keyHook(event);

            if (!handled && event.type == 'keydown') {
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

.clickable {
    color: blue;
    text-decoration: underline;
    cursor: pointer;
}

.copy-icon {
    cursor: pointer;
    font-size: 120%;
    color: blue;
}
</style>
