<template>
    <div ref="main" class="main">
        <div class="layout back" @wheel.prevent.stop="onMouseWheel">
            <div class="absolute" v-html="background"></div>
            <div class="absolute" v-html="pageDivider"></div>
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
            @touchstart.stop="onTouchStart" @touchend.stop="onTouchEnd" @touchmove.stop="onTouchMove" @touchcancel.prevent.stop="onTouchCancel"
            oncontextmenu="return false;">
            <div v-show="showStatusBar && statusBarClickOpen" v-html="statusBarClickable" @mousedown.prevent.stop @touchstart.stop
                @click.prevent.stop="onStatusBarClick"></div>
        </div>
        <div v-show="!clickControl && showStatusBar && statusBarClickOpen" class="layout" v-html="statusBarClickable" @mousedown.prevent.stop @touchstart.stop
            @click.prevent.stop="onStatusBarClick">
        </div>
        <!-- невидимым делать нельзя (display: none), вовремя не подгружаютя шрифты -->
        <canvas ref="offscreenCanvas" class="layout" style="visibility: hidden"></canvas>
        <div ref="measureWidth" style="position: absolute; visibility: hidden"></div>
    </div>
</template>

<script>
//-----------------------------------------------------------------------------
import Vue from 'vue';
import Component from 'vue-class-component';
import {loadCSS} from 'fg-loadcss';
import _ from 'lodash';

import './TextPage.css';

import * as utils from '../../../share/utils';
import dynamicCss from '../../../share/dynamicCss';

import bookManager from '../share/bookManager';
import wallpaperStorage from '../share/wallpaperStorage';
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
    pageDivider = null;
    page1 = null;
    page2 = null;
    statusBar = null;
    statusBarClickable = null;

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

        this.debouncedDrawPageDividerAndOrnament = _.throttle(() => {
            this.drawPageDividerAndOrnament();
        }, 65);

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

        this.$root.$on('resize', async() => {
            this.$nextTick(this.onResize);
            await utils.sleep(500);
            this.$nextTick(this.onResize);
        });
    }

    mounted() {
        this.context = this.$refs.offscreenCanvas.getContext('2d');
    }

    hex2rgba(hex, alpha = 1) {
        const [r, g, b] = hex.match(/\w\w/g).map(x => parseInt(x, 16));
        return `rgba(${r},${g},${b},${alpha})`;
    }

    calcDrawProps() {
        const wideLetter = 'Щ';

        //preloaded fonts
        this.fontList = [`12px ${this.fontName}`];

        //widths
        this.realWidth = this.$refs.main.clientWidth;
        this.realHeight = this.$refs.main.clientHeight;

        this.$refs.layoutEvents.style.width = this.realWidth + 'px';
        this.$refs.layoutEvents.style.height = this.realHeight + 'px';

        const dual = (this.dualPageMode ? 2 : 1);
        this.boxW = this.realWidth - 2*this.indentLR;
        this.w = this.boxW/dual - (this.dualPageMode ? 2*this.dualIndentLR : 0);

        this.scrollHeight = this.realHeight - (this.showStatusBar ? this.statusBarHeight : 0);
        this.h = this.scrollHeight - 2*this.indentTB;

        this.lineHeight = this.fontSize + this.lineInterval;
        this.pageRowsCount = 1 + Math.floor((this.h - this.lineHeight + this.lineInterval/2)/this.lineHeight);
        this.pageLineCount = (this.dualPageMode ? this.pageRowsCount*2 : this.pageRowsCount)

        //stuff
        this.currentAnimation = '';
        this.pageChangeDirectionDown = true;
        this.fontShift = this.fontVertShift/100;
        this.textShift = this.textVertShift/100 + this.fontShift;

        //statusBar
        this.$refs.statusBar.style.left = '0px';
        this.$refs.statusBar.style.top = (this.statusBarTop ? 1 : this.realHeight - this.statusBarHeight) + 'px';

        const sbColor = (this.statusBarColorAsText ? this.textColor : this.statusBarColor);
        this.statusBarRgbaColor = this.hex2rgba(sbColor || '#000000', this.statusBarColorAlpha);
        const ddColor = (this.dualDivColorAsText ? this.textColor : this.dualDivColor);
        this.dualDivRgbaColor = this.hex2rgba(ddColor || '#000000', this.dualDivColorAlpha);

        //drawHelper
        this.drawHelper.realWidth = this.realWidth;
        this.drawHelper.realHeight = this.realHeight;
        this.drawHelper.lastBook = this.lastBook;
        this.drawHelper.book = this.book;
        this.drawHelper.parsed = this.parsed;
        this.drawHelper.pageRowsCount = this.pageRowsCount;
        this.drawHelper.pageLineCount = this.pageLineCount;

        this.drawHelper.dualPageMode = this.dualPageMode;
        this.drawHelper.dualIndentLR = this.dualIndentLR;
        /*this.drawHelper.dualDivWidth = this.dualDivWidth;
        this.drawHelper.dualDivHeight = this.dualDivHeight;
        this.drawHelper.dualDivRgbaColor = this.dualDivRgbaColor;
        this.drawHelper.dualDivStrokeFill = this.dualDivStrokeFill;
        this.drawHelper.dualDivStrokeGap = this.dualDivStrokeGap;
        this.drawHelper.dualDivShadowWidth = this.dualDivShadowWidth;*/

        this.drawHelper.backgroundColor = this.backgroundColor;
        this.drawHelper.statusBarRgbaColor = this.statusBarRgbaColor;
        this.drawHelper.fontStyle = this.fontStyle;
        this.drawHelper.fontWeight = this.fontWeight;
        this.drawHelper.fontSize = this.fontSize;
        this.drawHelper.fontName = this.fontName;
        this.drawHelper.fontShift = this.fontShift;
        this.drawHelper.textColor = this.textColor;
        this.drawHelper.textShift = this.textShift;
        this.drawHelper.p = this.p;
        this.drawHelper.boxW = this.boxW;
        this.drawHelper.w = this.w;
        this.drawHelper.h = this.h;
        this.drawHelper.indentLR = this.indentLR;
        this.drawHelper.textAlignJustify = this.textAlignJustify;
        this.drawHelper.lineHeight = this.lineHeight;
        this.drawHelper.context = this.context;

        //альтернатива context.measureText
        if (!this.context.measureText(wideLetter).width) {
            const ctx = this.$refs.measureWidth;
            this.drawHelper.measureText = function(text, style) {
                ctx.innerText = text;
                ctx.style.font = this.fontByStyle(style);
                return ctx.clientWidth;
            };

            this.drawHelper.measureTextFont = function(text, font) {
                ctx.innerText = text;
                ctx.style.font = font;
                return ctx.clientWidth;
            }
        }

        //statusBar
        this.statusBarClickable = this.drawHelper.statusBarClickable(this.statusBarTop, this.statusBarHeight);

        //wallpaper css, асинхронно
        (async() => {
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
        })();

        //parsed
        if (this.parsed) {
            let wideLine = wideLetter;
            if (!this.drawHelper.measureText(wideLine, {}))
                throw new Error('Ошибка measureText');
            while (this.drawHelper.measureText(wideLine, {}) < this.w) wideLine += wideLetter;

            this.parsed.setSettings({
                p: this.p,
                w: this.w,
                font: this.font,
                fontSize: this.fontSize,
                wordWrap: this.wordWrap,
                cutEmptyParagraphs: this.cutEmptyParagraphs,
                addEmptyParagraphs: this.addEmptyParagraphs,
                maxWordLength: wideLine.length - 1,
                lineHeight: this.lineHeight,
                showImages: this.showImages,
                showInlineImagesInCenter: this.showInlineImagesInCenter,
                imageHeightLines: this.imageHeightLines,
                imageFitWidth: this.imageFitWidth,
                compactTextPerc: this.compactTextPerc,
                testWidth: 0,
                measureText: this.drawHelper.measureText.bind(this.drawHelper),
            });
        }

        //scrolling page
        const pageSpace = this.scrollHeight - this.pageRowsCount*this.lineHeight;
        let top = pageSpace/2;
        if (this.showStatusBar)
            top += this.statusBarHeight*(this.statusBarTop ? 1 : 0);
        let page1 = this.$refs.scrollBox1.style;
        let page2 = this.$refs.scrollBox2.style;
        
        page1.perspective = page2.perspective = '3072px';

        page1.width = page2.width = this.boxW + this.indentLR + 'px';
        page1.height = page2.height = this.scrollHeight - (pageSpace > 0 ? pageSpace : 0) + 'px';
        page1.top = page2.top = top + 'px';
        page1.left = page2.left = this.indentLR + 'px';

        page1 = this.$refs.scrollingPage1.style;
        page2 = this.$refs.scrollingPage2.style;
        page1.width = page2.width = this.boxW + this.indentLR + 'px';
        page1.height = page2.height = this.scrollHeight + this.lineHeight + 'px';
    }

    async checkLoadedFonts() {
        let loaded = await Promise.all(this.fontList.map(font => document.fonts.check(font)));
        if (loaded.some(r => !r)) {
            await Promise.all(this.fontList.map(font => document.fonts.load(font)));
        }
    }

    async loadFonts() {
        this.fontsLoading = true;

        let close = null;
        (async() => {
            await utils.sleep(500);
            if (this.fontsLoading)
                close = this.$root.notify.info('Загрузка шрифта &nbsp;<i class="la la-snowflake icon-rotate" style="font-size: 150%"></i>');
        })();

        if (!this.fontsLoaded)
            this.fontsLoaded = {};
        //загрузка дин.шрифта
        const loaded = this.fontsLoaded[this.fontCssUrl];
        if (this.fontCssUrl && !loaded) {
            loadCSS(this.fontCssUrl);
            this.fontsLoaded[this.fontCssUrl] = 1;
        }

        try {
            await this.checkLoadedFonts();
        } catch (e) {
            this.$root.notify.error('Некоторые шрифты не удалось загрузить', 'Ошибка загрузки');
        }

        this.fontsLoading = false;
        if (close)
            close();
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

        if (omitLoadFonts) {
            this.draw();
        } else {
            // ширина шрифта некоторое время выдается неверно,
            // не удалось событийно отловить этот момент, поэтому костыль
            while (this.checkingFont) {
                this.stopCheckingFont = true;
                await utils.sleep(100);
            }

            this.checkingFont = true;
            this.stopCheckingFont = false;
            try {
                const parsed = this.parsed;

                let i = 0;
                const t = 'Это тестовый текст. Его ширина выдается системой неправильно некоторое время.';
                let twprev = 0;
                //5 секунд проверяем изменения шрифта
                while (!this.stopCheckingFont && i++ < 50 && this.parsed === parsed) {
                    const tw = this.drawHelper.measureText(t, {});
                    if (tw !== twprev) {
                        this.parsed.setSettings({testWidth: tw});
                        this.draw();
                        twprev = tw;
                    }
                    await utils.sleep(100);
                }
            } finally {
                this.checkingFont = false;
            }
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
        this.parsed = null;

        this.linesUp = null;
        this.linesDown = null;

        this.statusBarMessage = '';

        this.getSettings();
        this.calcDrawProps();
        this.draw();// пока не загрузили, очистим канвас

        if (this.lastBook) {
            (async() => {
                try {
                    //подождем ленивый парсинг
                    this.stopLazyParse = true;
                    while (this.doingLazyParse) await utils.sleep(10);

                    const isParsed = await bookManager.hasBookParsed(this.lastBook);
                    if (!isParsed) {
                        return;
                    }

                    this.book = await bookManager.getBook(this.lastBook);
                    this.meta = bookManager.metaOnly(this.book);
                    const bt = utils.getBookTitle(this.meta.fb2);

                    this.title = bt.fullTitle;

                    this.$root.$emit('set-app-title', this.title);

                    this.parsed = this.book.parsed;

                    this.page1 = null;
                    this.page2 = null;
                    this.statusBar = null;
                    await this.stopTextScrolling();

                    await this.calcPropsAndLoadFonts();

                    this.refreshTime();
                    if (this.lazyParseEnabled)
                        this.lazyParsePara();
                } catch (e) {
                    this.$root.stdDialog.alert(e.message, 'Ошибка', {color: 'negative'});
                }
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
        if (this.wallpaperIgnoreStatusBar) {
            this.background = `<div class="layout" style="width: ${this.realWidth}px; height: ${this.realHeight}px;` +
                ` background-color: ${this.backgroundColor}">` +
                `<div class="layout ${this.wallpaper}" style="width: ${this.realWidth}px; height: ${this.scrollHeight}px; ` +
                    `top: ${(this.showStatusBar && this.statusBarTop ? this.statusBarHeight + 1 : 0)}px; position: relative;">` +
                `</div>` +
            `</div>`;
        } else {
            this.background = `<div class="layout ${this.wallpaper}" style="width: ${this.realWidth}px; height: ${this.realHeight}px;` +
                ` background-color: ${this.backgroundColor}"></div>`;
        }

    }

    async onResize() {
        try {
            this.calcDrawProps();
            this.setBackground();
            this.draw();
        } catch (e) {
            //
        }
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
            return new Promise((resolve, reject) => { (async() => {
                this[waitingHandlerName] = resolve;
                let wait = (timeout + 201)/100;
                while (wait > 0 && !this[stopPropertyName]) {
                    wait--;
                    await utils.sleep(100);
                }
                resolve();
            })().catch(reject); });
        };
        return func;
    }

    async startTextScrolling() {
        if (this.doingScrolling || !this.book || !this.parsed.textLength || !this.linesDown || this.pageLineCount < 1 ||
            this.linesDown.length <= this.pageLineCount || this.dualPageMode) {
            this.doStopScrolling();
            return;
        }

        //ждем анимацию
        while (this.inAnimation) await utils.sleep(10);

        this.stopScrolling = false;
        this.doingScrolling = true;

        const transitionFinish = this.generateWaitingFunc('resolveTransition1Finish', 'stopScrolling');

        if (!this.toggleLayout)
            this.page1 = this.page2;
        this.toggleLayout = true;
        await this.$nextTick();
        await utils.sleep(50);

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
        this.doStopScrolling();
        this.draw();
    }

    async stopTextScrolling() {
        this.stopScrolling = true;

        const page = this.$refs.scrollingPage1;
        page.style.transition = '';
        page.style.transform = 'none';
        page.offsetHeight;

        while (this.doingScrolling) await utils.sleep(10);
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
        this.debouncedDrawPageDividerAndOrnament();

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
            const transition2Finish = this.generateWaitingFunc('resolveTransition2Finish', 'stopAnimation');
            
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
                case 'rotate':
                    await this.drawHelper.doPageAnimationRotate(page1, page2, 
                        duration, this.pageChangeDirectionDown, transition1Finish, transition2Finish);
                    break;
                case 'flip':
                    await this.drawHelper.doPageAnimationFlip(page1, page2, 
                        duration, this.pageChangeDirectionDown, transition1Finish, transition2Finish, this.backgroundColor);
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

                //check image num
                let imageNum = 0;
                const len = (lines.length > 2 ? 2 : lines.length);
                loop:
                for (let j = 0; j < len; j++) {
                    const line = lines[j];
                    for (const part of line.parts) {
                        if (part.image) {
                            imageNum = part.image.num;
                            break loop;
                        }
                    }
                }
                //drawing
                this.statusBar = this.drawHelper.drawStatusBar(this.statusBarTop, this.statusBarHeight, 
                    lines[i].end, this.parsed.textLength, message, imageNum, this.parsed.images.length);

                this.bookPosSeen = lines[i].end;
            }
        } else {
            this.statusBar = '';
        }
    }

    drawPageDividerAndOrnament() {
        if (this.dualPageMode) {
            this.pageDivider = `<div class="layout" style="width: ${this.realWidth}px; height: ${this.scrollHeight}px; ` + 
                `top: ${(this.showStatusBar && this.statusBarTop ? this.statusBarHeight + 1 : 0)}px; position: relative;">` +
                `<div class="fit row justify-center items-center no-wrap">` +
                    `<div style="height: ${Math.round(this.scrollHeight*this.dualDivHeight/100)}px; width: ${this.dualDivWidth}px; ` +
                        `box-shadow: 0 0 ${this.dualDivShadowWidth}px ${this.dualDivRgbaColor}; ` + 
                        `background-image: url(&quot;data:image/svg+xml;utf8,<svg width='100%' height='100%' xmlns='http://www.w3.org/2000/svg'>` +
                            `<line x1='${this.dualDivWidth/2}' y1='0' x2='${this.dualDivWidth/2}' y2='100%' stroke='${this.dualDivRgbaColor}' ` +
                                `stroke-width='${this.dualDivWidth}' stroke-dasharray='${this.dualDivStrokeFill} ${this.dualDivStrokeGap}'/>` +
                        `</svg>&quot;);">` +
                    `</div>` +
                `</div>` +
            `</div>`;
        } else {
            this.pageDivider = null;
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
                await utils.sleep(1);
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
            await utils.sleep(60*1000);

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
            if (i >= 0 && this.linesDown.length >= 2*i + (this.keepLastToFirst ? 1 : 0)) {
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

    doToolBarToggle(event) {
        this.$emit('do-action', {action: 'switchToolbar', event});
    }

    doScrollingToggle() {
        this.$emit('do-action', {action: 'scrolling', event});
    }

    doFullScreenToggle() {
        this.$emit('do-action', {action: 'fullScreen', event});
    }

    doStopScrolling() {
        this.$emit('do-action', {action: 'stopScrolling', event});
    }

    async doFontSizeInc() {
        if (!this.settingsChanging) {
            this.settingsChanging = true;
            const newSize = (this.settings.fontSize + 1 < 200 ? this.settings.fontSize + 1 : 100);
            this.commit('reader/setSettings', {fontSize: newSize});
            await utils.sleep(50);
            this.settingsChanging = false;
        }
    }

    async doFontSizeDec() {
        if (!this.settingsChanging) {
            this.settingsChanging = true;
            const newSize = (this.settings.fontSize - 1 > 5 ? this.settings.fontSize - 1 : 5);
            this.commit('reader/setSettings', {fontSize: newSize});
            await utils.sleep(50);
            this.settingsChanging = false;
        }
    }

    async doScrollingSpeedUp() {
        if (!this.settingsChanging) {
            this.settingsChanging = true;
            const newDelay = (this.settings.scrollingDelay - 50 > 1 ? this.settings.scrollingDelay - 50 : 1);
            this.commit('reader/setSettings', {scrollingDelay: newDelay});
            await utils.sleep(50);
            this.settingsChanging = false;
        }
    }

    async doScrollingSpeedDown() {
        if (!this.settingsChanging) {
            this.settingsChanging = true;
            const newDelay = (this.settings.scrollingDelay + 50 < 10000 ? this.settings.scrollingDelay + 50 : 10000);
            this.commit('reader/setSettings', {scrollingDelay: newDelay});
            await utils.sleep(50);
            this.settingsChanging = false;
        }
    }

    async startClickRepeat(pointX, pointY) {
        this.repX = pointX;
        this.repY = pointY;

        if (!this.repInit && this.repDoing) {
            this.repInit = true;
            let delay = 400;
            while (this.repDoing) {
                this.handleClick(pointX, pointY);
                await utils.sleep(delay);
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
        if (!this.$isMobileDevice)
            return;
        this.endClickRepeat();

        if (event.touches.length == 1) {
            const touch = event.touches[0];
            const rect = event.target.getBoundingClientRect();
            const x = touch.pageX - rect.left;
            const y = touch.pageY - rect.top;
            const hc = this.handleClick(x, y, new Set(['Menu']));
            if (hc) {
                if (hc != 'Menu') {
                    this.repDoing = true;
                    this.debouncedStartClickRepeat(x, y);
                } else {
                    this.startTouch = {x, y};
                }
            }
        }
    }

    onTouchMove(event) {
        if (this.startTouch) {
            event.preventDefault();
        }
    }

    onTouchEnd(event) {
        if (!this.$isMobileDevice)
            return;
        this.endClickRepeat();

        if (event.changedTouches.length == 1) {
            const touch = event.changedTouches[0];
            const rect = event.target.getBoundingClientRect();
            const x = touch.pageX - rect.left;
            const y = touch.pageY - rect.top;
            if (this.startTouch) {
                const dy = this.startTouch.y - y;
                const dx = this.startTouch.x - x;
                const moveDelta = 30;
                const touchDelta = 15;
                if (dy > 0 && Math.abs(dy) >= moveDelta && Math.abs(dy) > Math.abs(dx)) {
                    //движение вверх
                    this.doFullScreenToggle();
                } else if (dy < 0 && Math.abs(dy) >= moveDelta && Math.abs(dy) > Math.abs(dx)) {
                    //движение вниз
                    this.doScrollingToggle();
                } else if (dx > 0 && Math.abs(dx) >= moveDelta && Math.abs(dy) < Math.abs(dx)) {
                    //движение влево
                    this.doScrollingSpeedDown();
                } else if (dx < 0 && Math.abs(dx) >= moveDelta && Math.abs(dy) < Math.abs(dx)) {
                    //движение вправо
                    this.doScrollingSpeedUp();
                } else if (Math.abs(dy) < touchDelta && Math.abs(dx) < touchDelta) {
                    this.doToolBarToggle(event);
                }

                this.startTouch = null;
            }
        }
    }

    onTouchCancel() {
        if (!this.$isMobileDevice)
            return;
        this.endClickRepeat();
    }

    onMouseDown(event) {
        if (this.$isMobileDevice)
            return;
        this.endClickRepeat();
        if (event.button == 0) {
            const hc = this.handleClick(event.offsetX, event.offsetY);
            if (hc && hc != 'Menu') {
                this.repDoing = true;
                this.debouncedStartClickRepeat(event.offsetX, event.offsetY);
            }
        } else if (event.button == 1) {
            this.doScrollingToggle();
        } else if (event.button == 2) {
            this.doToolBarToggle(event);
        }
    }

    onMouseUp() {
        if (this.$isMobileDevice)
            return;
        this.endClickRepeat();
    }

    onMouseWheel(event) {
        if (this.$isMobileDevice)
            return;
        if (event.deltaY > 0) {
            this.doDown();
        } else if (event.deltaY < 0) {
            this.doUp();
        }
    }

    onStatusBarClick() {
        const url = this.meta.url;
        if (url && url.indexOf('disk://') != 0) {
            window.open(url, '_blank');
        } else {
            this.$root.stdDialog.alert('Оригинал недоступен, т.к. файл книги был загружен с локального диска.', ' ', {color: 'info'});
        }
    }

    getClickAction(pointX, pointY) {
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

        return action;
    }

    handleClick(pointX, pointY, exclude) {
        const action = this.getClickAction(pointX, pointY);

        if (!exclude || !exclude.has(action)) {
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
        }

        return action;
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

.on-top {
    z-index: 100;
}

.back {
    z-index: 5;
}

.events {
    z-index: 20;
    background-color: rgba(0,0,0,0);
}

</style>
