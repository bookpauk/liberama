<template>
    <div ref="main" class="main">
        <canvas ref="canvas" class="canvas" @mousedown.prevent.stop="onMouseDown" @mouseup.prevent.stop="onMouseUp"
            @wheel.prevent.stop="onMouseWheel"
            @touchstart.prevent.stop="onTouchStart" @touchend.prevent.stop="onTouchEnd"
            oncontextmenu="return false;"></canvas>
    </div>
</template>

<script>
//-----------------------------------------------------------------------------
import Vue from 'vue';
import Component from 'vue-class-component';
import _ from 'lodash';
import {sleep} from '../../../share/utils';

import bookManager from '../share/bookManager';

export default @Component({
    watch: {
        bookPos: function(newValue) {
            this.debouncedEmitPosChange(newValue);
            this.drawPage();
        },
    },
})
class TextPage extends Vue {
    lastBook = null;
    bookPos = 0;

    //убрать
    meta = null;
    items = null;

    created() {
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
        this.canvas = this.$refs.canvas;        
        this.context = this.canvas.getContext('2d');
    }

    hex2rgba(hex, alpha = 1) {
        const [r, g, b] = hex.match(/\w\w/g).map(x => parseInt(x, 16));
        return `rgba(${r},${g},${b},${alpha})`;
    }

    async calcDrawProps() {
        this.realWidth = this.$refs.main.clientWidth;
        this.realHeight = this.$refs.main.clientHeight;

        let ratio = window.devicePixelRatio;
        if (ratio) {
            this.canvas.width = this.realWidth*ratio;
            this.canvas.height = this.realHeight*ratio;
            this.canvas.style.width = this.$refs.main.clientWidth + 'px';
            this.canvas.style.height = this.$refs.main.clientHeight + 'px';
            this.context.scale(ratio, ratio);
        } else {
            this.canvas.width = this.realWidth;
            this.canvas.height = this.realHeight;
        }

        this.w = this.realWidth - 2*this.indent;
        this.h = this.realHeight - (this.showStatusBar ? this.statusBarHeight : 0);
        this.lineHeight = this.fontSize + this.lineInterval;
        this.pageLineCount = Math.floor(this.h/this.lineHeight);

        this.context.textAlign = 'left';
        this.context.textBaseline = 'bottom';
        this.statusBarColor = this.hex2rgba(this.textColor, 0.5);

        if (this.parsed) {
            this.parsed.p = this.p;
            this.parsed.w = this.w;// px, ширина текста
            this.parsed.font = this.font;
            this.parsed.wordWrap = this.wordWrap;
            this.measureText = (text, style) => {// eslint-disable-line no-unused-vars
                if (style)
                    this.context.font = this.fontByStyle(style);
                return this.context.measureText(text).width;
            };
            this.parsed.measureText = this.measureText;
        }
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

        //draw props
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

        this.showStatusBar = true;
        this.statusBarTop = false;//top, bottom
        this.statusBarHeight = 20;// px

        this.calcDrawProps();
        this.drawPage();// пока не загрузили, очистим канвас

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

                this.drawPage();
            })();
        }
    }

    onResize() {
        this.calcDrawProps();
        this.drawPage();
    }

    get font() {
        return `${this.fontStyle} ${this.fontSize}px ${this.fontName}`;
    }

    fontByStyle(style) {
        return `${style.italic ? 'italic' : ''} ${style.bold ? 'bold' : ''} ${this.fontSize}px ${this.fontName}`;
    }

    fontBySize(size) {
        return `${size}px ${this.fontName}`;
    }

    drawPercentBar(x, y, w, h) {
        const context = this.context;

        const pad = 3;
        const fh = h - 2*pad;
        const fh2 = fh/2;

        const t1 = `${Math.floor(this.bookPos/1000)}k/${Math.floor(this.parsed.textLength/1000)}k`;
        const w1 = this.measureText(t1) + fh2;
        const read = this.bookPos/this.parsed.textLength;
        const t2 = `${(read*100).toFixed(2)}%`;
        const w2 = this.measureText(t2);
        let w3 = w - w1 - w2;

        if (w1 + w2 <= w)
            context.fillText(t1, x, y + h - 2);
        
        if (w1 + w2 + w3 <= w && w3 > (10 + fh2)) {
            const barWidth = w - w1 - w2 - fh2;
            context.strokeRect(x + w1, y + pad + 1, barWidth, fh - 2);
            context.fillRect(x + w1 + 2, y + pad + 3, (barWidth - 4)*read, fh - 6);
        }

        if (w1 <= w)
            context.fillText(t2, x + w1 + w3, y + h - 2);
    }

    fittingString(str, maxWidth) {
        const context = this.context;
        let w = context.measureText(str).width;
        const ellipsis = '…';
        const ellipsisWidth = context.measureText(ellipsis).width;
        if (w <= maxWidth || w <= ellipsisWidth) {
            return str;
        } else {
            let len = str.length;
            while (w >= maxWidth - ellipsisWidth && len-- > 0) {
                str = str.substring(0, len);
                w = context.measureText(str).width;
            }
            return str + ellipsis;
        }
    }

    async drawStatusBar() {
        if (!this.showStatusBar || !this.book)
            return;

        const context = this.context;

        const h = (this.statusBarTop ? 1 : this.realHeight - this.statusBarHeight);
        const lh = (this.statusBarTop ? this.statusBarHeight : h);

        context.fillStyle = this.backgroundColor;
        context.fillRect(0, h, this.realWidth, lh);

        context.font = 'bold ' + this.fontBySize(this.statusBarHeight - 6);
        context.fillStyle = this.statusBarColor;
        context.strokeStyle = this.statusBarColor;

        context.fillRect(0, lh, this.realWidth, 1);

        const date = new Date();
        const time = `  ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}  `;
        const timeW = this.measureText(time);
        context.fillText(time, this.realWidth - timeW, h + this.statusBarHeight - 2);

        const title = '  ' + this.title;
        context.fillText(this.fittingString(title, this.realWidth/2 - 3), 0, h + this.statusBarHeight - 2);

        this.drawPercentBar(this.realWidth/2, h, this.realWidth/2 - timeW, this.statusBarHeight);

        if (!this.timeRefreshing) {
            this.timeRefreshing = true;
            await sleep(60*1000);
            this.timeRefreshing = false;
            this.drawStatusBar();
        }
    }

    drawPage() {
        if (!this.lastBook)
            return;

        const context = this.context;

        context.fillStyle = this.backgroundColor;
        context.fillRect(0, 0, this.realWidth, this.realHeight);

        if (!this.book || !this.parsed.textLength)
            return;

        this.drawStatusBar();

        context.font = this.font;
        context.fillStyle = this.textColor;
        const spaceWidth = this.context.measureText(' ').width;

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
                            x += this.measureText(word) + (i < partWords.length - 1 ? space : 0);
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
                    x += this.measureText(text);
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
            i--;
            if (i >= 0 && this.linesDown.length > i) {
                this.bookPos = this.linesDown[i].begin;
            }
        }
    }

    doPageUp() {
        if (this.linesUp) {
            let i = this.pageLineCount;
            i--;
            i = (i > this.linesUp.length - 1 ? this.linesUp.length - 1 : i);
            if (i >= 0 && this.linesUp.length > i) {
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

    async startClickRepeat(pointX, pointY) {
        if (!this.repInit) {
            this.repInit = true;

            this.repStart = true;
            
            await sleep(1000);

            if (this.debouncedRepStart) {
                this.debouncedRepStart = false;
                this.repInit = false;
                await this.startClickRepeat(pointX, pointY);
            }

            if (this.repStart) {
                this.repDoing = true;

                let delay = 500;
                while (this.repDoing) {
                    this.handleClick(pointX, pointY);
                    await sleep(delay);
                    if (delay > 15)
                        delay *= 0.7;
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
            this.handleClick(touch.clientX, touch.clientY);
            this.startClickRepeat(touch.clientX, touch.clientY);
        }
    }

    onTouchEnd() {
        this.endClickRepeat();
    }

    onMouseDown(event) {
        this.endClickRepeat();
        if (event.button == 0) {
            this.handleClick(event.clientX, event.clientY);
            this.startClickRepeat(event.clientX, event.clientY);
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
