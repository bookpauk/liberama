<template>
    <div ref="main" class="main">
        <div class="layout back">
            <div v-html="background"></div>
            <!-- img -->
        </div>
        <div v-show="toggleLayout" class="layout">
            <div v-html="page1"></div>
        </div>
        <div v-show="!toggleLayout" class="layout">
            <div v-html="page2"></div>
        </div>
        <div v-show="showStatusBar" ref="statusBar" class="layout">
            <div v-html="statusBar"></div>
        </div>
        <div ref="layoutEvents" class="layout events" @mousedown.prevent.stop="onMouseDown" @mouseup.prevent.stop="onMouseUp"
            @wheel.prevent.stop="onMouseWheel"
            @touchstart.stop="onTouchStart" @touchend.stop="onTouchEnd" @touchcancel.prevent.stop="onTouchCancel"
            oncontextmenu="return false;">
            <div v-show="showStatusBar" v-html="statusBarClickable" @mousedown.prevent.stop @touchstart.stop
                @click.prevent.stop="onStatusBarClick"></div>
            <div v-show="fontsLoading" ref="fontsLoading"></div>
        </div>
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
const minLayoutWidth = 100;

export default @Component({
    watch: {
        bookPos: function(newValue) {
            this.debouncedEmitPosChange(newValue);
            this.draw();
        },
        settings: function() {
            this.debouncedLoadSettings();
        },
    },
})
class TextPage extends Vue {
    toggleLayout = false;
    showStatusBar = false;
    background = null;
    page1 = null;
    page2 = null;
    statusBar = null;
    statusBarClickable = null;
    fontsLoading = null;

    lastBook = null;
    bookPos = 0;

    fontStyle = null;
    fontSize = null;
    fontName = null;

    meta = null;

    created() {
        this.drawHelper = new DrawHelper();

        this.commit = this.$store.commit;
        this.dispatch = this.$store.dispatch;
        this.config = this.$store.state.config;
        this.reader = this.$store.state.reader;

        this.debouncedEmitPosChange = _.debounce((newValue) => {
            this.$emit('book-pos-changed', {bookPos: newValue, bookPosSeen: this.bookPosSeen});
        }, 1000);

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

        this.debouncedUpdatePage = _.debounce((lines) => {
            this.toggleLayout = !this.toggleLayout;

            if (this.toggleLayout)
                this.page1 = this.drawPage(lines);
            else
                this.page2 = this.drawPage(lines);

            this.doPageTransition();
        }, 10);

        this.$root.$on('resize', () => {this.$nextTick(this.onResize)});
        this.mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent);

/*
        const settings = Object.assign({}, this.settings);
        let updated = false;
        for (let prop in rstore.settingDefaults) {
            if (!settings.hasOwnProperty(prop)) {
                settings[prop] = rstore.settingDefaults[prop];
                updated = true;
            }
        }
        if (updated) 
            this.commit('reader/setSettings', settings);
*/
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
        this.h = this.realHeight - (this.showStatusBar ? this.statusBarHeight : 0) - 2*this.indentTB;
        this.lineHeight = this.fontSize + this.lineInterval;
        this.pageLineCount = 1 + Math.floor((this.h - this.fontSize)/this.lineHeight);

        if (this.parsed) {
            this.parsed.p = this.p;
            this.parsed.w = this.w;// px, ширина текста
            this.parsed.font = this.font;
            this.parsed.wordWrap = this.wordWrap;
            let t = '';
            while (this.measureText(t, {}) < this.w) t += 'Щ';
            this.parsed.maxWordLength = t.length - 1;
            this.parsed.measureText = this.measureText;
        }

        //сообщение "Загрузка шрифтов..."
        const flText = 'Загрузка шрифта...';
        this.$refs.fontsLoading.innerHTML = flText;
        const fontsLoadingStyle = this.$refs.fontsLoading.style;
        fontsLoadingStyle.position = 'absolute';
        fontsLoadingStyle.fontSize = this.fontSize + 'px';
        fontsLoadingStyle.top = (this.realHeight/2 - 2*this.fontSize) + 'px';
        fontsLoadingStyle.left = (this.realWidth - this.measureText(flText, {}))/2 + 'px';

        //stuff
        this.statusBarColor = this.hex2rgba(this.textColor || '#000000', this.statusBarColorAlpha);
        this.currentTransition = '';
        this.pageChangeDirectionDown = true;
        this.fontShift = this.fontVertShift/100;
        this.textShift = this.textVertShift/100 + this.fontShift;

        //drawHelper
        this.drawHelper.realWidth = this.realWidth;
        this.drawHelper.realHeight = this.realHeight;

        this.drawHelper.backgroundColor = this.backgroundColor;
        this.drawHelper.statusBarColor = this.statusBarColor;
        this.drawHelper.fontName = this.fontName;
        this.drawHelper.fontShift = this.fontShift;
        this.drawHelper.measureText = this.measureText;
        this.drawHelper.measureTextFont = this.measureTextFont;

        this.$refs.statusBar.style.left = '0px';
        this.$refs.statusBar.style.top = (this.statusBarTop ? 1 : this.realHeight - this.statusBarHeight) + 'px';

        this.statusBarClickable = this.drawHelper.statusBarClickable(this.statusBarTop, this.statusBarHeight);
    }

    measureText(text, style) {// eslint-disable-line no-unused-vars
        this.context.font = this.fontByStyle(style);
        return this.context.measureText(text).width;
    }

    measureTextFont(text, font) {// eslint-disable-line no-unused-vars
        this.context.font = font;
        return this.context.measureText(text).width;
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

        // шрифты хрен знает когда подгружаются, поэтому
        const parsed = this.parsed;
        if (!parsed.force) {
            let i = 0;
            parsed.force = true;
            while (i < 10) {
                await sleep(1000);
                if (this.parsed != parsed)
                    break;
                this.draw();
                i++;
            }
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
        this.book = null;
        this.meta = null;
        this.fb2 = null;
        this.parsed = null;

        this.linesUp = null;
        this.linesDown = null;

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

                const authorName = _.compact([
                    this.fb2.lastName,
                    this.fb2.firstName,
                    this.fb2.middleName
                ]).join(' ');
                this.title = _.compact([
                    authorName,
                    this.fb2.bookTitle
                ]).join(' - ');

                this.$root.$emit('set-app-title', this.title);

                this.parsed = this.book.parsed;

                this.page1 = null;
                this.page2 = null;
                this.statusBar = null;

                this.calcPropsAndLoadFonts();

                this.refreshTime();
                if (this.lazyParseEnabled)
                    this.lazyParsePara();
            })();
        }
    }

    setBackground() {
        this.background = `<div class="layout" style="width: ${this.realWidth}px; height: ${this.realHeight}px;` + 
            ` background-color: ${this.backgroundColor}"></div>`;
    }

    onResize() {
        this.page1 = null;
        this.page2 = null;
        this.statusBar = null;

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

    fontByStyle(style) {
        return `${style.italic ? 'italic' : this.fontStyle} ${style.bold ? 'bold' : this.fontWeight} ${this.fontSize}px ${this.fontName}`;
    }

    draw() {
        if (this.w < minLayoutWidth) {
            this.page1 = null;
            this.page2 = null;
            this.statusBar = null;
            return;
        }

        if (this.book && this.bookPos > 0 && this.bookPos >= this.parsed.textLength) {
            this.doEnd();
            return;
        }


        if (this.pageChangeDirectionDown && this.pagePrepared && this.bookPos == this.bookPosPrepared) {
            this.toggleLayout = !this.toggleLayout;
            this.linesDown = this.linesDownNext;
            this.linesUp = this.linesUpNext;
            this.doPageTransition();
        } else {
            const lines = this.getLines(this.bookPos);
            this.linesDown = lines.linesDown;
            this.linesUp = lines.linesUp;

            /*if (this.toggleLayout)
                this.page1 = this.drawPage(lines.linesDown);
            else
                this.page2 = this.drawPage(lines.linesDown);*/
            
            this.debouncedUpdatePage(lines.linesDown);
        }

        this.pagePrepared = false;
        this.debouncedPrepareNextPage();
        this.debouncedDrawStatusBar();

        if (this.book && this.linesDown && this.linesDown.length < this.pageLineCount)
            this.doEnd();
    }

    doPageTransition() {
        if (this.currentTransition) {
            //this.currentTransition
            //this.pageChangeTransitionSpeed
            //this.pageChangeDirectionDown  
            
            //curr to next transition
            //пока заглушка
        }

        this.currentTransition = '';
        this.pageChangeDirectionDown = false;//true только если PgDown
    }

    getLines(bookPos) {
        if (!this.parsed || this.pageLineCount < 1)
            return {};

        return {
            linesDown: this.parsed.getLines(bookPos, 2*this.pageLineCount),
            linesUp: this.parsed.getLines(bookPos, -2*this.pageLineCount)
        };
    }

    drawPage(lines) {
        if (!this.lastBook || this.pageLineCount < 1)
            return '';

        let out = `<div class="layout" style="width: ${this.realWidth}px; height: ${this.realHeight}px;` + 
            ` color: ${this.textColor}">`;

        if (!this.book || !lines || !this.parsed.textLength) {
            out += '</div>';
            return out;
        }

        const spaceWidth = this.measureText(' ', {});

        let y = this.indentTB + (this.h - this.pageLineCount*this.lineHeight + this.lineInterval)/2 + this.fontSize*this.textShift;
        if (this.showStatusBar)
            y += this.statusBarHeight*(this.statusBarTop ? 1 : 0);

        let len = lines.length;
        len = (len > this.pageLineCount ? len = this.pageLineCount : len);
        for (let i = 0; i < len; i++) {
            const line = lines[i];
            /* line:
            {
                begin: Number,
                end: Number,
                first: Boolean,
                last: Boolean,
                parts: array of {
                    style: {bold: Boolean, italic: Boolean, center: Boolean}
                    text: String,
                }
            }*/

            let indent = this.indentLR + (line.first ? this.p : 0);

            let lineText = '';
            let center = false;
            let centerStyle = {};
            for (const part of line.parts) {
                lineText += part.text;
                center = center || part.style.center;
                if (part.style.center)
                    centerStyle = part.style;
            }

            let filled = false;
            // если выравнивание по ширине включено
            if (this.textAlignJustify && !line.last && !center) {
                const words = lineText.split(' ');

                if (words.length > 1) {
                    const spaceCount = words.length - 1;

                    const space = (this.w - line.width + spaceWidth*spaceCount)/spaceCount;

                    let x = indent;
                    for (const part of line.parts) {
                        const font = this.fontByStyle(part.style);
                        let partWords = part.text.split(' ');

                        for (let i = 0; i < partWords.length; i++) {
                            let word = partWords[i];
                            out += this.drawHelper.fillText(word, x, y, font);
                            x += this.measureText(word, part.style) + (i < partWords.length - 1 ? space : 0);
                        }
                    }
                    filled = true;
                }
            }

            // просто выводим текст
            if (!filled) {
                let x = indent;
                x = (center ? this.indentLR + (this.w - this.measureText(lineText, centerStyle))/2 : x);
                for (const part of line.parts) {
                    let text = part.text;
                    const font = this.fontByStyle(part.style);
                    out += this.drawHelper.fillText(text, x, y, font);
                    x += this.measureText(text, part.style);
                }
            }
            y += this.lineHeight;
        }

        out += '</div>';
        return out;
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
            this.statusBarMessage = 'Книга загружена из кеша';
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
        
        if (!this.preparing) {
            this.preparing = true;

            (async() => {
                await sleep(100);
                if (this.cancelPrepare) {
                    this.preparing = false;
                    return;
                }

                let i = this.pageLineCount;
                if (this.keepLastToFirst)
                    i--;
                if (i >= 0 && this.linesDown.length > i) {
                    this.bookPosPrepared = this.linesDown[i].begin;
                    
                    const lines = this.getLines(this.bookPosPrepared);
                    this.linesDownNext = lines.linesDown;
                    this.linesUpNext =  lines.linesUp;

                    if (this.toggleLayout)
                        this.page2 = this.drawPage(lines.linesDown);//наоборот
                    else
                        this.page1 = this.drawPage(lines.linesDown);
  
                    this.pagePrepared = true;
                }

                this.preparing = false;
            })();
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
                this.currentTransition = this.pageChangeTransition;
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
                this.currentTransition = this.pageChangeTransition;
                this.pageChangeDirectionDown = false;
                this.bookPos = this.linesUp[i].begin;
            }
        }
    }

    doHome() {
        this.bookPos = 0;
    }

    doEnd() {
        if (this.parsed.para.length && this.pageLineCount > 0) {
            let i = this.parsed.para.length - 1;
            let lastPos = this.parsed.para[i].offset + this.parsed.para[i].length - 1;
            const lines = this.parsed.getLines(lastPos, -this.pageLineCount);
            if (lines) {
                i = this.pageLineCount - 1;
                i = (i > lines.length - 1 ? lines.length - 1 : i);
                this.bookPos = lines[i].begin;
            }
        }
    }

    doToolBarToggle() {
        this.$emit('tool-bar-toggle');
    }

    keyHook(event) {
        //console.log(event.code);
        if (event.type == 'keydown') {
            switch (event.code) {
                case 'ArrowDown':
                    this.doDown();
                    break;
                case 'ArrowUp':
                    this.doUp();
                    break;
                case 'PageDown':
                case 'ArrowRight':
                case 'Space':
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
                case 'Enter':
                case 'Backquote'://`
                case 'KeyF':
                    this.$emit('full-screen-toogle');
                    break;
                case 'Tab':
                    this.doToolBarToggle();
                    event.preventDefault();
                    event.stopPropagation();
                    break;
            }
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
        window.open(this.meta.url, '_blank');
    }

    handleClick(pointX, pointY) {
        const mouseLegend = {
            40: {30: 'PgUp', 100: 'PgDown'},
            60: {40: 'Up', 60: 'Menu', 100: 'Down'},
            100: {30: 'PgUp', 100: 'PgDown'}
        };

        const w = pointX/this.realWidth*100;
        const h = pointY/this.realHeight*100;

        let action = '';
        loops: {
            for (const x in mouseLegend) {
                for (const y in mouseLegend[x]) {
                    if (w < x && h < y) {
                        action = mouseLegend[x][y];
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

.back {
    z-index: 5;
}
.events {
    z-index: 20;
    background-color: rgba(0,0,0,0);
}
</style>
