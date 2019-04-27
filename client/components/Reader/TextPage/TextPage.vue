<template>
    <div ref="main" class="main">
        <div class="layout back" @wheel.prevent.stop="onMouseWheel">
            <div v-html="background"></div>
            <!-- img -->
        </div>
        <div ref="scrollBox1" class="layout over-hidden" @wheel.prevent.stop="onMouseWheel">
            <div ref="scrollingPage1" class="layout over-hidden" @transitionend="onPage1TransitionEnd" @animationend="onPage1AnimationEnd">
                <div v-html="page1"></div>
            </div>
        </div>
        <div ref="scrollBox2" class="layout over-hidden" @wheel.prevent.stop="onMouseWheel">
            <div ref="scrollingPage2" class="layout over-hidden" @transitionend="onPage2TransitionEnd" @animationend="onPage2AnimationEnd">
                <div v-html="page2"></div>
            </div>
        </div>
        <div v-show="showStatusBar" ref="statusBar" class="layout">
            <div v-html="statusBar"></div>
        </div>
        <div v-show="clickControl" ref="layoutEvents" class="layout events" @mousedown.prevent.stop="onMouseDown" @mouseup.prevent.stop="onMouseUp"
            @wheel.prevent.stop="onMouseWheel"
            @touchstart.stop="onTouchStart" @touchend.stop="onTouchEnd" @touchcancel.prevent.stop="onTouchCancel"
            oncontextmenu="return false;">
            <div v-show="showStatusBar" v-html="statusBarClickable" @mousedown.prevent.stop @touchstart.stop
                @click.prevent.stop="onStatusBarClick"></div>
            <div v-show="fontsLoading" ref="fontsLoading"></div>
        </div>
        <div v-show="!clickControl && showStatusBar" class="layout" v-html="statusBarClickable" @mousedown.prevent.stop @touchstart.stop
            @click.prevent.stop="onStatusBarClick"></div>
        <!-- невидимым делать нельзя, вовремя не подгружаютя шрифты -->
        <canvas ref="offscreenCanvas" class="layout" style="width: 0px; height: 0px"></canvas>
    </div>
</template>

<script>
//-----------------------------------------------------------------------------
import Vue from 'vue';
import Component from 'vue-class-component';
import {loadCSS} from 'fg-loadcss';
import _ from 'lodash';
import {sleep} from '../../../share/utils';

import bookManager from '../share/bookManager';
import DrawHelper from './DrawHelper';
import rstore from '../../../store/modules/reader';
import {clickMap} from '../share/clickMap';

const minLayoutWidth = 100;

export default @Component({
    watch: {
        bookPos: function() {
            this.$emit('book-pos-changed', {bookPos: this.bookPos, bookPosSeen: this.bookPosSeen});
            this.draw();
        },
        bookPosSeen: function() {
            this.$emit('book-pos-changed', {bookPos: this.bookPos, bookPosSeen: this.bookPosSeen});
        },
        settings: function() {
            this.debouncedLoadSettings();
        },
        toggleLayout: function() {
            this.updateLayout();
        },
        inAnimation: function() {
            this.updateLayout();
        },
    },
})
class TextPage extends Vue {
    toggleLayout = false;
    showStatusBar = false;
    clickControl = true;

    background = null;
    page1 = null;
    page2 = null;
    statusBar = null;
    statusBarClickable = null;
    fontsLoading = null;

    lastBook = null;
    bookPos = 0;
    bookPosSeen = null;

    fontStyle = null;
    fontSize = null;
    fontName = null;
    fontWeight = null;

    inAnimation = false;

    meta = null;

    created() {
        this.drawHelper = new DrawHelper();

        this.commit = this.$store.commit;
        this.dispatch = this.$store.dispatch;
        this.config = this.$store.state.config;
        this.reader = this.$store.state.reader;

        this.debouncedStartClickRepeat = _.debounce((x, y) => {
            this.startClickRepeat(x, y);
        }, 800);

        this.debouncedPrepareNextPage = _.debounce(() => {
            this.prepareNextPage();
        }, 100);

        this.debouncedDrawStatusBar = _.throttle(() => {
            this.drawStatusBar();
        }, 60);        

        this.debouncedLoadSettings = _.debounce(() => {
            this.loadSettings();
        }, 50);

        this.debouncedUpdatePage = _.debounce(async(lines) => {
            if (!this.pageChangeAnimation)
                this.toggleLayout = !this.toggleLayout;
            else {
                this.page2 = this.page1;
                this.toggleLayout = true;
            }

            if (this.toggleLayout)
                this.page1 = this.drawHelper.drawPage(lines);
            else
                this.page2 = this.drawHelper.drawPage(lines);

            await this.doPageAnimation();
        }, 10);

        this.$root.$on('resize', () => {this.$nextTick(this.onResize)});
        this.mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent);
    }

    mounted() {
        this.context = this.$refs.offscreenCanvas.getContext('2d');
    }

    hex2rgba(hex, alpha = 1) {
        const [r, g, b] = hex.match(/\w\w/g).map(x => parseInt(x, 16));
        return `rgba(${r},${g},${b},${alpha})`;
    }

    calcDrawProps() {
        //preloaded fonts
        this.fontList = [`12px ${this.fontName}`];

        //widths
        this.realWidth = this.$refs.main.clientWidth;
        this.realHeight = this.$refs.main.clientHeight;

        this.$refs.layoutEvents.style.width = this.realWidth + 'px';
        this.$refs.layoutEvents.style.height = this.realHeight + 'px';

        this.w = this.realWidth - 2*this.indentLR;
        this.scrollHeight = this.realHeight - (this.showStatusBar ? this.statusBarHeight : 0);
        this.h = this.scrollHeight - 2*this.indentTB;
        this.lineHeight = this.fontSize + this.lineInterval;
        this.pageLineCount = 1 + Math.floor((this.h - this.lineHeight + this.lineInterval/2)/this.lineHeight);

        this.$refs.scrollingPage1.style.width = this.w + 'px';
        this.$refs.scrollingPage2.style.width = this.w + 'px';

        //stuff
        this.currentAnimation = '';
        this.pageChangeDirectionDown = true;
        this.fontShift = this.fontVertShift/100;
        this.textShift = this.textVertShift/100 + this.fontShift;

        //statusBar
        this.$refs.statusBar.style.left = '0px';
        this.$refs.statusBar.style.top = (this.statusBarTop ? 1 : this.realHeight - this.statusBarHeight) + 'px';

        this.statusBarColor = this.hex2rgba(this.textColor || '#000000', this.statusBarColorAlpha);
        this.statusBarClickable = this.drawHelper.statusBarClickable(this.statusBarTop, this.statusBarHeight);

        //drawHelper
        this.drawHelper.realWidth = this.realWidth;
        this.drawHelper.realHeight = this.realHeight;
        this.drawHelper.lastBook = this.lastBook;
        this.drawHelper.book = this.book;
        this.drawHelper.parsed = this.parsed;
        this.drawHelper.pageLineCount = this.pageLineCount;

        this.drawHelper.backgroundColor = this.backgroundColor;
        this.drawHelper.statusBarColor = this.statusBarColor;
        this.drawHelper.fontStyle = this.fontStyle;
        this.drawHelper.fontWeight = this.fontWeight;
        this.drawHelper.fontSize = this.fontSize;
        this.drawHelper.fontName = this.fontName;
        this.drawHelper.fontShift = this.fontShift;
        this.drawHelper.textColor = this.textColor;
        this.drawHelper.textShift = this.textShift;
        this.drawHelper.p = this.p;
        this.drawHelper.w = this.w;
        this.drawHelper.h = this.h;
        this.drawHelper.indentLR = this.indentLR;
        this.drawHelper.textAlignJustify = this.textAlignJustify;
        this.drawHelper.lineHeight = this.lineHeight;
        this.drawHelper.context = this.context;

        //сообщение "Загрузка шрифтов..."
        this.$refs.fontsLoading.innerHTML = '';
        (async() => {
            await sleep(500);
            const flText = 'Загрузка шрифта';
            this.$refs.fontsLoading.innerHTML = flText + ' &nbsp;<i class="el-icon-loading"></i>';
            const fontsLoadingStyle = this.$refs.fontsLoading.style;
            fontsLoadingStyle.position = 'absolute';
            fontsLoadingStyle.fontSize = this.fontSize + 'px';
            fontsLoadingStyle.top = (this.realHeight/2 - 2*this.fontSize) + 'px';
            fontsLoadingStyle.left = (this.realWidth - this.drawHelper.measureText(flText, {}))/2 + 'px';
            await sleep(10500);
            this.$refs.fontsLoading.innerHTML = '';
        })();

        //parsed
        if (this.parsed) {
            this.parsed.p = this.p;
            this.parsed.w = this.w;// px, ширина текста
            this.parsed.font = this.font;
            this.parsed.fontSize = this.fontSize;
            this.parsed.wordWrap = this.wordWrap;
            this.parsed.cutEmptyParagraphs = this.cutEmptyParagraphs;
            this.parsed.addEmptyParagraphs = this.addEmptyParagraphs;
            let t = '';
            while (this.drawHelper.measureText(t, {}) < this.w) t += 'Щ';
            this.parsed.maxWordLength = t.length - 1;
            this.parsed.measureText = this.drawHelper.measureText.bind(this.drawHelper);
            this.parsed.lineHeight = this.lineHeight;
            this.parsed.showImages = this.showImages;
            this.parsed.showInlineImagesInCenter = this.showInlineImagesInCenter;
            this.parsed.imageHeightLines = this.imageHeightLines;
            this.parsed.imageFitWidth = this.imageFitWidth;
        }

        //scrolling page
        const pageSpace = this.scrollHeight - this.pageLineCount*this.lineHeight;
        let y = pageSpace/2;
        if (this.showStatusBar)
            y += this.statusBarHeight*(this.statusBarTop ? 1 : 0);
        let page1 = this.$refs.scrollBox1;
        let page2 = this.$refs.scrollBox2;
        page1.style.width = this.w + this.indentLR + 'px';
        page2.style.width = this.w + this.indentLR + 'px';
        page1.style.height = this.scrollHeight - (pageSpace > 0 ? pageSpace : 0) + 'px';
        page2.style.height = this.scrollHeight - (pageSpace > 0 ? pageSpace : 0) + 'px';
        page1.style.top = y + 'px';
        page2.style.top = y + 'px';
        page1.style.left = this.indentLR + 'px';
        page2.style.left = this.indentLR + 'px';

        page1 = this.$refs.scrollingPage1;
        page2 = this.$refs.scrollingPage2;
        page1.style.width = this.w + this.indentLR + 'px';
        page2.style.width = this.w + this.indentLR + 'px';
        page1.style.height = this.scrollHeight + this.lineHeight + 'px';
        page2.style.height = this.scrollHeight + this.lineHeight + 'px';
    }

    async checkLoadedFonts() {
        let loaded = await Promise.all(this.fontList.map(font => document.fonts.check(font)));
        if (loaded.some(r => !r)) {
            loaded = await Promise.all(this.fontList.map(font => document.fonts.load(font)));
            if (loaded.some(r => !r.length))
                throw new Error('some font not loaded');
        }
    }

    async loadFonts() {
        this.fontsLoading = true;

        if (!this.fontsLoaded)
            this.fontsLoaded = {};
        //загрузка дин.шрифта
        const loaded = this.fontsLoaded[this.fontCssUrl];
        if (this.fontCssUrl && !loaded) {
            loadCSS(this.fontCssUrl);
            this.fontsLoaded[this.fontCssUrl] = 1;
        }

        const waitingTime = 10*1000;
        const delay = 100;
        let i = 0;
        //ждем шрифты
        while (i < waitingTime/delay) {
            i++;
            try {
                await this.checkLoadedFonts();
                i = waitingTime;
            } catch (e) {
                await sleep(delay);
            }
        }
        if (i !== waitingTime) {
            this.$notify.error({
                title: 'Ошибка загрузки',
                message: 'Некоторые шрифты не удалось загрузить'
            });
        }

        this.fontsLoading = false;
    }

    getSettings() {
        const settings = this.settings;

        for (let prop in rstore.settingDefaults) {
            this[prop] = settings[prop];
        }

        const wf = this.webFontName;
        const i = _.findIndex(rstore.webFonts, ['name', wf]);
        if (wf && i >= 0) {
            this.fontName = wf;
            this.fontCssUrl = rstore.webFonts[i].css;
            this.fontVertShift = settings.fontShifts[wf] || 0;
        }
    }

    async calcPropsAndLoadFonts(omitLoadFonts) {
        this.calcDrawProps();
        this.setBackground();

        if (!omitLoadFonts)
            await this.loadFonts();

        this.draw();

        // шрифты хрен знает когда подгружаются в div, поэтому
        const parsed = this.parsed;
        await sleep(5000);
        if (this.parsed === parsed) {
            parsed.force = true;
            this.draw();
            parsed.force = false;
        }
    }

    loadSettings() {
        (async() => {
            let fontName = this.fontName;
            this.getSettings();
            await this.calcPropsAndLoadFonts(fontName == this.fontName);
        })();
    }

    showBook() {
        this.$refs.main.focus();

        this.toggleLayout = false;
        this.updateLayout();
        this.book = null;
        this.meta = null;
        this.fb2 = null;
        this.parsed = null;

        this.linesUp = null;
        this.linesDown = null;

        this.statusBarMessage = '';

        this.getSettings();
        this.calcDrawProps();
        this.draw();// пока не загрузили, очистим канвас

        if (this.lastBook) {
            (async() => {
                //подождем ленивый парсинг
                this.stopLazyParse = true;
                while (this.doingLazyParse) await sleep(10);

                const isParsed = await bookManager.hasBookParsed(this.lastBook);
                if (!isParsed) {
                    return;
                }

                this.book = await bookManager.getBook(this.lastBook);
                this.meta = bookManager.metaOnly(this.book);
                this.fb2 = this.meta.fb2;

                let authorNames = [];
                if (this.fb2.author) {
                    authorNames = this.fb2.author.map(a => _.compact([
                        a.lastName,
                        a.firstName,
                        a.middleName
                    ]).join(' '));
                }

                this.title = _.compact([
                    authorNames.join(', '),
                    this.fb2.bookTitle
                ]).join(' - ');

                this.$root.$emit('set-app-title', this.title);

                this.parsed = this.book.parsed;

                this.page1 = null;
                this.page2 = null;
                this.statusBar = null;
                await this.stopTextScrolling();

                this.calcPropsAndLoadFonts();

                this.refreshTime();
                if (this.lazyParseEnabled)
                    this.lazyParsePara();
            })();
        }
    }

    updateLayout() {
        if (this.inAnimation) {
            this.$refs.scrollBox1.style.visibility = 'visible';
            this.$refs.scrollBox2.style.visibility = 'visible';
        } else if (this.toggleLayout) {
            this.$refs.scrollBox1.style.visibility = 'visible';
            this.$refs.scrollBox2.style.visibility = 'hidden';
        } else {
            this.$refs.scrollBox1.style.visibility = 'hidden';
            this.$refs.scrollBox2.style.visibility = 'visible';
        }
    }

    setBackground() {
        this.background = `<div class="layout ${this.wallpaper}" style="width: ${this.realWidth}px; height: ${this.realHeight}px;` + 
            ` background-color: ${this.backgroundColor}"></div>`;
    }

    async onResize() {
        /*this.page1 = null;
        this.page2 = null;
        this.statusBar = null;*/

        this.calcDrawProps();
        this.setBackground();
        this.draw();
    }

    get settings() {
        return this.$store.state.reader.settings;
    }

    get font() {
        return `${this.fontStyle} ${this.fontWeight} ${this.fontSize}px ${this.fontName}`;
    }

    onPage1TransitionEnd() {
        if (this.resolveTransition1Finish)
            this.resolveTransition1Finish();
    }

    onPage2TransitionEnd() {
        if (this.resolveTransition2Finish)
            this.resolveTransition2Finish();
    }

    startSearch(needle) {
        this.drawHelper.needle = needle;
        this.drawHelper.searching = true;
        this.draw();
    }

    stopSearch() {
        this.drawHelper.searching = false;
        this.draw();
    }

    generateWaitingFunc(waitingHandlerName, stopPropertyName) {
        const func = (timeout) => {
            return new Promise(async(resolve) => {
                this[waitingHandlerName] = resolve;
                let wait = (timeout + 201)/100;
                while (wait > 0 && !this[stopPropertyName]) {
                    wait--;
                    await sleep(100);
                }
                resolve();
            });
        };
        return func;
    }

    async startTextScrolling() {
        if (this.doingScrolling || !this.book || !this.parsed.textLength || !this.linesDown || this.pageLineCount < 1 ||
            this.linesDown.length <= this.pageLineCount) {
            this.$emit('stop-scrolling');
            return;
        }

        //ждем анимацию
        while (this.inAnimation) await sleep(10);

        this.stopScrolling = false;
        this.doingScrolling = true;

        const transitionFinish = this.generateWaitingFunc('resolveTransition1Finish', 'stopScrolling');

        if (!this.toggleLayout)
            this.page1 = this.page2;
        this.toggleLayout = true;
        await this.$nextTick();
        await sleep(50);

        this.cachedPos = -1;
        this.draw();

        const page = this.$refs.scrollingPage1;
        let i = 0;
        while (!this.stopScrolling) {
                page.style.transition = `${this.scrollingDelay}ms ${this.scrollingType}`;
                page.style.transform = `translateY(-${this.lineHeight}px)`;

                if (i > 0) {
                    this.doDown();
                    if (this.linesDown.length <= this.pageLineCount + 1) {
                        this.stopScrolling = true;
                    }
                }
                await transitionFinish(this.scrollingDelay);
                page.style.transition = '';
                page.style.transform = 'none';
                page.offsetHeight;
                i++;
        }
        this.resolveTransition1Finish = null;
        this.doingScrolling = false;
        this.$emit('stop-scrolling');
        this.draw();
    }

    async stopTextScrolling() {
        this.stopScrolling = true;

        const page = this.$refs.scrollingPage1;
        page.style.transition = '';
        page.style.transform = 'none';
        page.offsetHeight;

        while (this.doingScrolling) await sleep(10);
    }

    draw() {
        //scrolling
        if (this.doingScrolling) {
            this.currentAnimation = '';
            
            if (this.cachedPos == this.bookPos) {
                this.linesDown = this.linesCached.linesDown;
                this.linesUp = this.linesCached.linesUp;
                this.page1 = this.pageCached;
            } else {
                const lines = this.getLines(this.bookPos);
                this.linesDown = lines.linesDown;
                this.linesUp = lines.linesUp;
                this.page1 = this.drawHelper.drawPage(lines.linesDown, true);
            }

            //caching next
            if (this.cachedPageTimer)
                clearTimeout(this.cachedPageTimer);
            this.cachedPageTimer = setTimeout(() => {
                if (this.linesDown && this.linesDown.length > this.pageLineCount && this.pageLineCount > 0) {
                    this.cachedPos = this.linesDown[1].begin;
                    this.linesCached = this.getLines(this.cachedPos);
                    this.pageCached = this.drawHelper.drawPage(this.linesCached.linesDown, true);
                }
                this.cachedPageTimer = null;
            }, 20);

            this.debouncedDrawStatusBar();
            return;
        }

        //check
        if (this.w < minLayoutWidth) {
            this.page1 = null;
            this.page2 = null;
            this.statusBar = null;
            return;
        }

        if (this.book && this.bookPos > 0 && this.bookPos >= this.parsed.textLength) {
            this.doEnd(true);
            return;
        }

        //fast draw prepared
        if (!this.pageChangeAnimation && this.pageChangeDirectionDown && this.pagePrepared && this.bookPos == this.bookPosPrepared) {
            this.toggleLayout = !this.toggleLayout;
            this.linesDown = this.linesDownNext;
            this.linesUp = this.linesUpNext;
        } else {//normal debounced draw
            const lines = this.getLines(this.bookPos);
            this.linesDown = lines.linesDown;
            this.linesUp = lines.linesUp;
            this.debouncedUpdatePage(lines.linesDown);
        }

        this.pagePrepared = false;
        if (!this.pageChangeAnimation)
            this.debouncedPrepareNextPage();
        this.debouncedDrawStatusBar();

        if (this.book && this.linesDown && this.linesDown.length < this.pageLineCount) {
            this.doEnd(true);
            return;
        }
    }

    onPage1AnimationEnd() {
        if (this.resolveAnimation1Finish)
            this.resolveAnimation1Finish();
    }

    onPage2AnimationEnd() {
        if (this.resolveAnimation2Finish)
            this.resolveAnimation2Finish();
    }

    async doPageAnimation() {
        if (this.currentAnimation && !this.inAnimation) {
            this.inAnimation = true;

            const animation1Finish = this.generateWaitingFunc('resolveAnimation1Finish', 'stopAnimation');
            const animation2Finish = this.generateWaitingFunc('resolveAnimation2Finish', 'stopAnimation');
            const transition1Finish = this.generateWaitingFunc('resolveTransition1Finish', 'stopAnimation');
            //const transition2Finish = this.generateWaitingFunc('resolveTransition2Finish', 'stopAnimation');
            
            const duration = Math.round(3000*(1 - this.pageChangeAnimationSpeed/100));
            let page1 = this.$refs.scrollingPage1;
            let page2 = this.$refs.scrollingPage2;

            switch (this.currentAnimation) {
                case 'thaw':
                    await this.drawHelper.doPageAnimationThaw(page1, page2, 
                        duration, this.pageChangeDirectionDown, animation1Finish);
                    break;
                case 'blink':
                    await this.drawHelper.doPageAnimationBlink(page1, page2, 
                        duration, this.pageChangeDirectionDown, animation1Finish, animation2Finish);
                    break;
                case 'rightShift':
                    await this.drawHelper.doPageAnimationRightShift(page1, page2, 
                        duration, this.pageChangeDirectionDown, transition1Finish);
                    break;
                case 'downShift':
                    page1.style.height = this.scrollHeight + 'px';
                    page2.style.height = this.scrollHeight + 'px';

                    await this.drawHelper.doPageAnimationDownShift(page1, page2, 
                        duration, this.pageChangeDirectionDown, transition1Finish);

                    page1.style.height = this.scrollHeight + this.lineHeight + 'px';
                    page2.style.height = this.scrollHeight + this.lineHeight + 'px';
                    break;
            }
            
            this.resolveAnimation1Finish = null;
            this.resolveAnimation2Finish = null;
            this.resolveTransition1Finish = null;
            this.resolveTransition2Finish = null;

            page1.style.animation = '';
            page2.style.animation = '';

            page1.style.transition = '';
            page1.style.transform = 'none';
            page1.offsetHeight;

            page2.style.transition = '';
            page2.style.transform = 'none';
            page2.offsetHeight;

            this.currentAnimation = '';
            this.pageChangeDirectionDown = false;//true только если PgDown

            this.inAnimation = false;
            this.stopAnimation = false;
        }
    }

    getLines(bookPos) {
        if (!this.parsed || this.pageLineCount < 1)
            return {};

        return {
            linesDown: this.parsed.getLines(bookPos, 2*this.pageLineCount),
            linesUp: this.parsed.getLines(bookPos, -2*this.pageLineCount)
        };
    }

    drawStatusBar(message) {
        if (this.w < minLayoutWidth) {
            this.statusBar = null;
            return;
        }

        if (this.showStatusBar && this.linesDown && this.pageLineCount > 0) {
            const lines = this.linesDown;
            let i = this.pageLineCount;
            if (this.keepLastToFirst)
                i--;
            i = (i > lines.length - 1 ? lines.length - 1 : i);
            if (i >= 0) {
                if (!message)
                    message = this.statusBarMessage;
                if (!message)
                    message = this.title;
                this.statusBar = this.drawHelper.drawStatusBar(this.statusBarTop, this.statusBarHeight, 
                    lines[i].end, this.parsed.textLength, message);
                this.bookPosSeen = lines[i].end;
            }
        } else {
            this.statusBar = '';
        }
    }

    blinkCachedLoadMessage(state) {
        if (state === 'finish') {
            this.statusBarMessage = '';
        } else if (state) {
            this.statusBarMessage = 'Книга загружена из кэша';
        } else {
            this.statusBarMessage = ' ';
        }
        this.drawStatusBar();
    }

    async lazyParsePara() {
        if (!this.parsed || this.doingLazyParse)
            return;
        this.doingLazyParse = true;
        let j = 0;
        let k = 0;
        let prevPerc = 0;
        this.stopLazyParse = false;
        for (let i = 0; i < this.parsed.para.length; i++) {
            j++;
            if (j > 1) {
                await sleep(1);
                j = 0;
            }
            if (this.stopLazyParse)
                break;
            this.parsed.parsePara(i);
            k++;
            if (k > 100) {
                let perc = Math.round(i/this.parsed.para.length*100);
                if (perc != prevPerc)
                    this.drawStatusBar(`Обработка текста ${perc}%`);
                prevPerc = perc;
                k = 0;
            }
        }
        this.drawStatusBar();
        this.doingLazyParse = false;
    }

    async refreshTime() {
        if (!this.timeRefreshing) {
            this.timeRefreshing = true;
            await sleep(60*1000);

            if (this.book && this.parsed.textLength) {
                this.debouncedDrawStatusBar();
            }
            this.timeRefreshing = false;
            this.refreshTime();
        }
    }

    prepareNextPage() {
        // подготовка следующей страницы заранее        
        if (!this.book || !this.parsed.textLength || !this.linesDown || this.pageLineCount < 1)
            return;
        
        let i = this.pageLineCount;
        if (this.keepLastToFirst)
            i--;
        if (i >= 0 && this.linesDown.length > i) {
            this.bookPosPrepared = this.linesDown[i].begin;
            
            const lines = this.getLines(this.bookPosPrepared);
            this.linesDownNext = lines.linesDown;
            this.linesUpNext =  lines.linesUp;

            if (this.toggleLayout)
                this.page2 = this.drawHelper.drawPage(lines.linesDown);//наоборот
            else
                this.page1 = this.drawHelper.drawPage(lines.linesDown);

            this.pagePrepared = true;
        }
    }

    doDown() {
        if (this.linesDown && this.linesDown.length > this.pageLineCount && this.pageLineCount > 0) {
            this.bookPos = this.linesDown[1].begin;
        }
    }

    doUp() {
        if (this.linesUp && this.linesUp.length > 1 && this.pageLineCount > 0) {
            this.bookPos = this.linesUp[1].begin;
        }
    }

    doPageDown() {
        if (this.linesDown && this.pageLineCount > 0) {
            let i = this.pageLineCount;
            if (this.keepLastToFirst)
                i--;
            if (i >= 0 && this.linesDown.length >= 2*i) {
                this.currentAnimation = this.pageChangeAnimation;
                this.pageChangeDirectionDown = true;
                this.bookPos = this.linesDown[i].begin;
            } else 
                this.doEnd();
        }
    }

    doPageUp() {
        if (this.linesUp && this.pageLineCount > 0) {
            let i = this.pageLineCount;
            if (this.keepLastToFirst)
                i--;
            i = (i > this.linesUp.length - 1 ? this.linesUp.length - 1 : i);
            if (i >= 0 && this.linesUp.length > i) {
                this.currentAnimation = this.pageChangeAnimation;
                this.pageChangeDirectionDown = false;
                this.bookPos = this.linesUp[i].begin;
            }
        }
    }

    doHome() {
        this.currentAnimation = this.pageChangeAnimation;
        this.pageChangeDirectionDown = false;
        this.bookPos = 0;
    }

    doEnd(noAni) {
        if (this.parsed.para.length && this.pageLineCount > 0) {
            let i = this.parsed.para.length - 1;
            let lastPos = this.parsed.para[i].offset + this.parsed.para[i].length - 1;
            const lines = this.parsed.getLines(lastPos, -this.pageLineCount);
            if (lines) {
                i = this.pageLineCount - 1;
                i = (i > lines.length - 1 ? lines.length - 1 : i);
                if (!noAni)
                    this.currentAnimation = this.pageChangeAnimation;
                this.pageChangeDirectionDown = true;
                this.bookPos = lines[i].begin;
            }
        }
    }

    doToolBarToggle() {
        this.$emit('tool-bar-toggle');
    }

    async doFontSizeInc() {
        if (!this.settingsChanging) {
            this.settingsChanging = true;
            const newSize = (this.settings.fontSize + 1 < 100 ? this.settings.fontSize + 1 : 100);
            const newSettings = Object.assign({}, this.settings, {fontSize: newSize});
            this.commit('reader/setSettings', newSettings);
            await sleep(50);
            this.settingsChanging = false;
        }
    }

    async doFontSizeDec() {
        if (!this.settingsChanging) {
            this.settingsChanging = true;
            const newSize = (this.settings.fontSize - 1 > 5 ? this.settings.fontSize - 1 : 5);
            const newSettings = Object.assign({}, this.settings, {fontSize: newSize});
            this.commit('reader/setSettings', newSettings);
            await sleep(50);
            this.settingsChanging = false;
        }
    }

    async doScrollingSpeedUp() {
        if (!this.settingsChanging) {
            this.settingsChanging = true;
            const newDelay = (this.settings.scrollingDelay - 50 > 1 ? this.settings.scrollingDelay - 50 : 1);
            const newSettings = Object.assign({}, this.settings, {scrollingDelay: newDelay});
            this.commit('reader/setSettings', newSettings);
            await sleep(50);
            this.settingsChanging = false;
        }
    }

    async doScrollingSpeedDown() {
        if (!this.settingsChanging) {
            this.settingsChanging = true;
            const newDelay = (this.settings.scrollingDelay + 50 < 10000 ? this.settings.scrollingDelay + 50 : 10000);
            const newSettings = Object.assign({}, this.settings, {scrollingDelay: newDelay});
            this.commit('reader/setSettings', newSettings);
            await sleep(50);
            this.settingsChanging = false;
        }
    }

    keyHook(event) {
        let result = false;
        if (event.type == 'keydown' && !event.ctrlKey && !event.altKey) {
            result = true;
            switch (event.code) {
                case 'ArrowDown':
                    if (event.shiftKey)
                        this.doScrollingSpeedUp();
                    else
                        this.doDown();
                    break;
                case 'ArrowUp':
                    if (event.shiftKey)
                        this.doScrollingSpeedDown();
                    else
                        this.doUp();
                    break;
                case 'PageDown':
                case 'ArrowRight':
                    this.doPageDown();
                    break;
                case 'Space':
                    if (event.shiftKey)
                        this.doPageUp();
                    else
                        this.doPageDown();
                    break;
                case 'PageUp':
                case 'ArrowLeft':
                case 'Backspace':
                    this.doPageUp();
                    break;
                case 'Home':
                    this.doHome();
                    break;
                case 'End':
                    this.doEnd();
                    break;
                case 'KeyA':
                    if (event.shiftKey)
                        this.doFontSizeDec();
                    else
                        this.doFontSizeInc();
                    break;
                case 'Enter':
                case 'Backquote'://`
                case 'KeyF':
                    this.$emit('full-screen-toogle');
                    break;
                case 'Tab':
                case 'KeyQ':
                    this.doToolBarToggle();
                    event.preventDefault();
                    event.stopPropagation();
                    break;
                default:
                    result = false;
                    break;
            }
        }
        return result;
    }

    async startClickRepeat(pointX, pointY) {
        this.repX = pointX;
        this.repY = pointY;

        if (!this.repInit && this.repDoing) {
            this.repInit = true;
            let delay = 400;
            while (this.repDoing) {
                this.handleClick(pointX, pointY);
                await sleep(delay);
                if (delay > 15)
                    delay *= 0.8;
            }
            this.repInit = false;
        }
    }

    endClickRepeat() {
        this.repDoing = false;
    }

    onTouchStart(event) {
        if (!this.mobile)
            return;
        this.endClickRepeat();
        if (event.touches.length == 1) {
            const touch = event.touches[0];
            const rect = event.target.getBoundingClientRect();
            const x = touch.pageX - rect.left;
            const y = touch.pageY - rect.top;
            if (this.handleClick(x, y)) {
                this.repDoing = true;
                this.debouncedStartClickRepeat(x, y);
            }
        }
    }

    onTouchEnd() {
        if (!this.mobile)
            return;
        this.endClickRepeat();
    }

    onTouchCancel() {
        if (!this.mobile)
            return;
        this.endClickRepeat();
    }

    onMouseDown(event) {
        if (this.mobile)
            return;
        this.endClickRepeat();
        if (event.button == 0) {
            if (this.handleClick(event.offsetX, event.offsetY)) {
                this.repDoing = true;
                this.debouncedStartClickRepeat(event.offsetX, event.offsetY);
            }
        } else if (event.button == 1) {
            this.$emit('scrolling-toggle');
        } else if (event.button == 2) {
            this.doToolBarToggle();
        }
    }

    onMouseUp() {
        if (this.mobile)
            return;
        this.endClickRepeat();
    }

    onMouseWheel(event) {
        if (this.mobile)
            return;
        if (event.deltaY > 0) {
            this.doDown();
        } else if (event.deltaY < 0) {
            this.doUp();
        }
    }

    onStatusBarClick() {
        const url = this.meta.url;
        if (url && url.indexOf('file://') != 0) {
            window.open(url, '_blank');
        } else {
            this.$alert('Оригинал недоступен, т.к. файл книги был загружен с локального диска', '', {type: 'warning'});
        }
    }

    handleClick(pointX, pointY) {
        const w = pointX/this.realWidth*100;
        const h = pointY/this.realHeight*100;

        let action = '';
        loops: {
            for (const x in clickMap) {
                for (const y in clickMap[x]) {
                    if (w < x && h < y) {
                        action = clickMap[x][y];
                        break loops;
                    }
                }
            }
        }

        switch (action) {
            case 'Down' ://Down
                this.doDown();
                break;
            case 'Up' ://Up
                this.doUp();
                break;
            case 'PgDown' ://PgDown
                this.doPageDown();
                break;
            case 'PgUp' ://PgUp
                this.doPageUp();
                break;
            case 'Menu' :
                this.doToolBarToggle();
                break;
            default :
                // Nothing
        }

        return (action && action != 'Menu');
   }

}
//-----------------------------------------------------------------------------
</script>
<style scoped>
.main {
    flex: 1;
    margin: 0;
    padding: 0;
    overflow: hidden;
    position: relative;
    min-width: 200px;
}

.layout {
    margin: 0;
    padding: 0;
    position: absolute;
    z-index: 10;
}

.over-hidden {
    overflow: hidden;
}

.back {
    z-index: 5;
}

.events {
    z-index: 20;
    background-color: rgba(0,0,0,0);
}

</style>

<style>
.paper1 {
    background: url("images/paper1.jpg") center;
    background-size: cover;
}

.paper2 {
    background: url("images/paper2.jpg") center;
    background-size: cover;
}

.paper3 {
    background: url("images/paper3.jpg") center;
    background-size: cover;
}

.paper4 {
    background: url("images/paper4.jpg") center;
    background-size: cover;
}

.paper5 {
    background: url("images/paper5.jpg") center;
    background-size: cover;
}

.paper6 {
    background: url("images/paper6.jpg") center;
    background-size: cover;
}

.paper7 {
    background: url("images/paper7.jpg") center;
    background-size: cover;
}

.paper8 {
    background: url("images/paper8.jpg") center;
    background-size: cover;
}

.paper9 {
    background: url("images/paper9.jpg");
}

@keyframes page1-animation-thaw {
    0%   { opacity: 0; }
    100% { opacity: 1; }
}

@keyframes page2-animation-thaw {
    0%   { opacity: 1; }
    100% { opacity: 0; }
}
</style>
