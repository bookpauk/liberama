<template>
    <div ref="main" class="main">
        <canvas v-show="canvasShow" ref="canvasPrev" class="canvas" @mousedown.prevent.stop="onMouseDown" @mouseup.prevent.stop="onMouseUp"
            @wheel.prevent.stop="onMouseWheel"
            @touchstart.prevent.stop="onTouchStart" @touchend.prevent.stop="onTouchEnd"
            oncontextmenu="return false;">
        </canvas>
        <canvas v-show="!canvasShow" ref="canvasNext" class="canvas" @mousedown.prevent.stop="onMouseDown" @mouseup.prevent.stop="onMouseUp"
            @wheel.prevent.stop="onMouseWheel"
            @touchstart.prevent.stop="onTouchStart" @touchend.prevent.stop="onTouchEnd"
            oncontextmenu="return false;">
        </canvas>
    </div>
</template>

<script>
//-----------------------------------------------------------------------------
import Vue from 'vue';
import Component from 'vue-class-component';
import _ from 'lodash';
import {sleep} from '../../../share/utils';

import bookManager from '../share/bookManager';
import DrawHelper from './DrawHelper';

export default @Component({
    watch: {
        bookPos: function(newValue) {
            this.debouncedEmitPosChange(newValue);
            this.draw();
        },
    },
})
class TextPage extends Vue {
    canvasShow = false;

    lastBook = null;
    bookPos = 0;

    fontStyle = null;
    fontSize = null;
    fontName = null;

    created() {
        this.drawHelper = new DrawHelper();

        this.commit = this.$store.commit;
        this.dispatch = this.$store.dispatch;
        this.config = this.$store.state.config;
        this.reader = this.$store.state.reader;

        this.debouncedEmitPosChange = _.debounce((newValue) => {
            this.$emit('book-pos-changed', {bookPos: newValue});
        }, 1000);

        this.$root.$on('resize', () => {this.$nextTick(this.onResize)});
    }

    mounted() {
        this.canvasPrev = this.$refs.canvasPrev;
        this.canvasNext = this.$refs.canvasNext;
    }

    hex2rgba(hex, alpha = 1) {
        const [r, g, b] = hex.match(/\w\w/g).map(x => parseInt(x, 16));
        return `rgba(${r},${g},${b},${alpha})`;
    }

    async calcDrawProps() {
        this.contextPrev = this.canvasPrev.getContext('2d');
        this.contextNext = this.canvasNext.getContext('2d');

        this.realWidth = this.$refs.main.clientWidth;
        this.realHeight = this.$refs.main.clientHeight;

        let ratio = window.devicePixelRatio;
        if (ratio) {
            this.canvasPrev.width = this.realWidth*ratio;
            this.canvasPrev.height = this.realHeight*ratio;
            this.canvasPrev.style.width = this.$refs.main.clientWidth + 'px';
            this.canvasPrev.style.height = this.$refs.main.clientHeight + 'px';
            this.contextPrev.scale(ratio, ratio);

            this.canvasNext.width = this.realWidth*ratio;
            this.canvasNext.height = this.realHeight*ratio;
            this.canvasNext.style.width = this.$refs.main.clientWidth + 'px';
            this.canvasNext.style.height = this.$refs.main.clientHeight + 'px';            
            this.contextNext.scale(ratio, ratio);
        } else {
            this.canvasPrev.width = this.realWidth;
            this.canvasPrev.height = this.realHeight;
            this.canvasNext.width = this.realWidth;
            this.canvasNext.height = this.realHeight;
        }

        this.contextPrev.textAlign = 'left';
        this.contextNext.textAlign = 'left';
        this.contextPrev.textBaseline = 'bottom';
        this.contextNext.textBaseline = 'bottom';
        this.canvasShow = false;

        this.w = this.realWidth - 2*this.indent;
        this.h = this.realHeight - (this.showStatusBar ? this.statusBarHeight : 0);
        this.lineHeight = this.fontSize + this.lineInterval;
        this.pageLineCount = Math.floor(this.h/this.lineHeight);

        if (this.parsed) {
            this.parsed.p = this.p;
            this.parsed.w = this.w;// px, ширина текста
            this.parsed.font = this.font;
            this.parsed.wordWrap = this.wordWrap;
            this.parsed.context = this.contextPrev;
            this.parsed.fontByStyle = this.fontByStyle;
        }

        this.statusBarColor = this.hex2rgba(this.textColor, 0.5);
        this.currentTransition = '';
        this.pageChangeDirectionDown = true;

        //drawHelper
        this.drawHelper.realWidth = this.realWidth;
        this.drawHelper.realHeight = this.realHeight;

        this.drawHelper.backgroundColor = this.backgroundColor;
        this.drawHelper.statusBarColor = this.statusBarColor;
        this.drawHelper.fontName = this.fontName;
    }

    async loadFonts() {
        let loaded = await Promise.all(this.fontList.map(font => document.fonts.check(font)));
        if (loaded.some(r => !r)) {
            loaded = await Promise.all(this.fontList.map(font => document.fonts.load(font)));
            if (loaded.some(r => !r.length))
                throw new Error('some font not loaded');
        }
    }

    showBook() {
        this.$refs.main.focus();
        this.book = null;
        this.meta = null;
        this.fb2 = null;
        this.parsed = null;

        this.linesUp = null;
        this.linesDown = null;

        //preloaded fonts
        this.fontList = ['12px ReaderDefault', '12px Arial', '12px ComicSansMS', '12px OpenSans', '12px Roboto', '12px ArialNarrow',
            '12px Georgia', '12px Tahoma', '12px Helvetica', '12px CenturySchoolbook'];

        //default draw props
        this.textColor = '#000000';
        this.backgroundColor = '#478355';
        this.fontStyle = '';// 'bold','italic'
        this.fontSize = 33;// px
        this.fontName = 'Arial';
        this.lineInterval = 7;// px, межстрочный интервал
        this.textAlignJustify = true;// выравнивание по ширине
        this.p = 50;// px, отступ параграфа
        this.indent = 15;// px, отступ всего текста слева и справа
        this.wordWrap = true;
        this.keepLastToFirst = true;// перенос последней строки в первую при листании

        this.showStatusBar = true;
        this.statusBarTop = false;// top, bottom
        this.statusBarHeight = 20;// px

        this.pageChangeTransition = '';// '' - нет, upDown, leftRight, thawing - протаивание, blink - мерцание
        this.pageChangeTransitionSpeed = 50; //0-100%

        this.calcDrawProps();
        this.draw(true);// пока не загрузили, очистим канвас

        if (this.lastBook) {
            (async() => {
                const isParsed = await bookManager.hasBookParsed(this.lastBook);
                if (!isParsed) {
                    return;
                }
                this.book = await bookManager.getBook(this.lastBook);
                this.meta = bookManager.metaOnly(this.book);
                this.fb2 = this.meta.fb2;

                this.title = _.compact([
                    this.fb2.lastName,
                    this.fb2.middleName,
                    this.fb2.firstName,
                    '-',
                    this.fb2.bookTitle
                ]).join(' ');

                this.$root.$emit('set-app-title', this.title);

                const parsed = this.book.parsed;
                this.parsed = parsed;
                this.calcDrawProps();

                await this.loadFonts();

                this.draw();
            })();
        }
    }

    onResize() {
        this.calcDrawProps();
        this.draw(true);
    }

    get font() {
        return `${this.fontStyle} ${this.fontSize}px ${this.fontName}`;
    }

    fontByStyle(style) {
        return `${style.italic ? 'italic' : ''} ${style.bold ? 'bold' : ''} ${this.fontSize}px ${this.fontName}`;
    }

    get context() {
        return (this.canvasShow ? this.contextPrev : this.contextNext);
    }
    
    get canvas() {
        return (this.canvasShow ? this.canvasPrev : this.canvasNext);
    }
    
    draw(immediate) {
        this.canvasShow = !this.canvasShow;
        const context = this.context;

        if (immediate) {
            this.drawPage(context);
        } else {
            if (!(this.pageChangeDirectionDown && this.pagePrepared && this.bookPos == this.bookPosPrepared)) {
                this.drawPage(context);
            }
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
    }

    drawPage(context) {
        if (!this.lastBook)
            return;

        context.fillStyle = this.backgroundColor;
        context.fillRect(0, 0, this.realWidth, this.realHeight);

        if (!this.book || !this.parsed.textLength)
            return;

        if (this.showStatusBar)
            this.drawHelper.drawStatusBar(context, this.statusBarTop, this.statusBarHeight, 
                this.statusBarColor, this.bookPos, this.parsed.textLength, this.title);
/*        
        if (!this.timeRefreshing) {
            this.timeRefreshing = true;
            await sleep(60*1000);
            this.timeRefreshing = false;
            this.drawStatusBar();
        }
*/
        context.font = this.font;
        context.fillStyle = this.textColor;
        const spaceWidth = context.measureText(' ').width;

        const lines = this.parsed.getLines(this.bookPos, this.pageLineCount + 1);
        this.linesUp = this.parsed.getLines(this.bookPos, -(this.pageLineCount + 1));
        this.linesDown = lines;

        let y = -this.lineInterval/2 + (this.h - this.pageLineCount*this.lineHeight)/2;
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
                    style: {bold: Boolean, italic: Boolean}
                    text: String,
                }
            }*/

            let indent = this.indent + (line.first ? this.p : 0);
            y += this.lineHeight;

            let filled = false;
            // если выравнивание по ширине включено
            if (this.textAlignJustify && !line.last) {
                let lineText = '';
                for (const part of line.parts) {
                    lineText += part.text;
                }
                const words = lineText.split(' ');

                if (words.length > 1) {
                    const spaceCount = words.length - 1;

                    const space = (this.w - line.width + spaceWidth*spaceCount)/spaceCount;

                    let x = indent;
                    for (const part of line.parts) {
                        context.font = this.fontByStyle(part.style);
                        let partWords = part.text.split(' ');

                        for (let i = 0; i < partWords.length; i++) {
                            let word = partWords[i];
                            context.fillText(word, x, y);
                            x += context.measureText(word).width + (i < partWords.length - 1 ? space : 0);
                        }
                    }
                    filled = true;
                }
            }

            // просто выводим текст
            if (!filled) {
                let x = indent;
                for (const part of line.parts) {
                    let text = part.text;
                    context.font = this.fontByStyle(part.style);
                    context.fillText(text, x, y);
                    x += context.measureText(text).width;
                }
            }
        }
    }
    
    doDown() {
        if (this.linesDown && this.linesDown.length > 1) {
            this.bookPos = this.linesDown[1].begin;
        }
    }

    doUp() {
        if (this.linesUp && this.linesUp.length > 1) {
            this.bookPos = this.linesUp[1].begin;
        }
    }

    doPageDown() {
        if (this.linesDown) {
            let i = this.pageLineCount;
            if (this.keepLastToFirst)
                i--;
            if (i >= 0 && this.linesDown.length > i) {
                this.currentTransition = this.pageChangeTransition;
                this.pageChangeDirectionDown = true;
                this.bookPos = this.linesDown[i].begin;
            }
        }
    }

    doPageUp() {
        if (this.linesUp) {
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
        if (this.parsed.para.length) {
            const lastPara = this.parsed.para[this.parsed.para.length - 1];
            this.bookPos = lastPara.offset + lastPara.length - 1;
        }
    }

    doToolBarToggle() {
        this.$emit('tool-bar-toggle');
    }

    keyHook(event) {
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
                case 'Enter':
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
            }
        }
    }

    async startClickRepeat(pointX, pointY, debounced) {
        this.repX = pointX;
        this.repY = pointY;

        if (!this.repInit) {
            this.repInit = true;

            this.repStart = true;
            
            if (!debounced)
                await sleep(800);

            if (this.debouncedRepStart) {
                this.debouncedRepStart = false;
                this.repInit = false;
                await this.startClickRepeat(this.repX, this.repY, true);
            }

            if (this.repStart) {
                this.repDoing = true;

                let delay = 400;
                while (this.repDoing) {
                    this.handleClick(pointX, pointY);
                    await sleep(delay);
                    if (delay > 15)
                        delay *= 0.8;
                }
            }

            this.repInit = false;
        } else {
            this.debouncedRepStart = true;
        }
    }

    endClickRepeat() {
        this.repStart = false;
        this.repDoing = false;
        this.debouncedRepStart = false;
    }

    onTouchStart(event) {
        this.endClickRepeat();
        if (event.touches.length == 1) {
            const touch = event.touches[0];
            const x = touch.pageX - this.canvas.offsetLeft;
            const y = touch.pageY - this.canvas.offsetTop;
            this.handleClick(x, y);
            this.startClickRepeat(x, y);
        }
    }

    onTouchEnd() {
        this.endClickRepeat();
    }

    onMouseDown(event) {
        this.endClickRepeat();
        if (event.button == 0) {
            const x = event.pageX - this.canvas.offsetLeft;
            const y = event.pageY - this.canvas.offsetTop;
            this.handleClick(x, y);
            this.startClickRepeat(x, y);
        } else if (event.button == 2) {
            this.doToolBarToggle();
        }
    }

    onMouseUp() {
        this.endClickRepeat();
    }

    onMouseWheel(event) {
        if (event.deltaY > 0) {
            this.doDown();
        } else if (event.deltaY < 0) {
            this.doUp();
        }
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

        return !!action;
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
}

.canvas {
    margin: 0;
    padding: 0;
}
</style>
