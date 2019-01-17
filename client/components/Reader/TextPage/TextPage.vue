<template>
    <div ref="main" class="main">
        <canvas ref="canvas" class="canvas"></canvas>
    </div>
</template>

<script>
//-----------------------------------------------------------------------------
import Vue from 'vue';
import Component from 'vue-class-component';
import _ from 'lodash';

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
        }, 100);

        window.addEventListener('resize', () => {
            this.onResize();
        });
    }

    mounted() {
        this.canvas = this.$refs.canvas;        
        this.context = this.canvas.getContext('2d');
        this.context.textAlign = 'left';
        this.context.textBaseline = 'bottom';
    }

    async calcDrawProps() {
        this.canvas.width = this.$refs.main.clientWidth;
        this.canvas.height = this.$refs.main.clientHeight;
        this.lineHeight = this.fontSize + this.lineInterval;
        this.pageLineCount = Math.floor(this.canvas.height/this.lineHeight);
        this.w = this.canvas.width - 2*this.indent;
        
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
        this.textColor = 'black';
        this.backgroundColor = '#478355';
        this.fontStyle = '';// 'bold','italic'
        this.fontSize = 40;// px
        this.fontName = 'Arial';
        this.lineInterval = 15;// px, межстрочный интервал
        this.textAlignJustify = true;// выравнивание по ширине
        this.p = 60;// px, отступ параграфа
        this.indent = 20;// px, отступ всего текста слева и справа
        this.wordWrap = true;

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

                this.$root.$emit('set-app-title', _.compact([
                    this.fb2.lastName,
                    this.fb2.middleName,
                    this.fb2.firstName,
                    '-',
                    this.fb2.bookTitle
                ]).join(' '));

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

    drawPage() {
        if (!this.lastBook)
            return;

        //пустой канвас
        const canvas = this.canvas;
        const context = this.context;

        context.fillStyle = this.backgroundColor;
        context.fillRect(0, 0, canvas.width, canvas.height);

        if (!this.book)
            return;

        context.font = this.font;
        context.fillStyle = this.textColor;
        const spaceWidth = this.context.measureText(' ').width;

        const lines = this.parsed.getLines(this.bookPos, this.pageLineCount + 1);

        let len = lines.length;
        len = (len > this.pageLineCount ? len = this.pageLineCount : len);
        let y = 0;
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
                            x += this.measureText(word, part.style) + (i < partWords.length - 1 ? space : 0);
                        }
                    }
                    filled = true;
                }
            }

            if (!filled) {
                let x = indent;
                for (const part of line.parts) {
                    let text = part.text;
                    context.font = this.fontByStyle(part.style);
                    context.fillText(text, x, y);
                    x += this.measureText(text, part.style);
                }
            }
        }

        this.linesUp = this.parsed.getLines(this.bookPos, -(this.pageLineCount + 1));
        this.linesDown = lines;
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
