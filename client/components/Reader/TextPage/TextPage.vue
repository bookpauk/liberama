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
    }

    mounted() {
        this.canvas = this.$refs.canvas;        
        this.context = this.canvas.getContext('2d');
        this.context.textAlign = 'left';
    }

    calcDrawProps() {
        this.canvas.width = this.$refs.main.clientWidth;
        this.canvas.height = this.$refs.main.clientHeight;
        this.lineHeight = this.fontSize + this.lineInterval;
        this.pageLineCount = Math.floor(this.canvas.height/this.lineHeight);
    }

    showBook() {
        this.$refs.main.focus();
        this.book = null;
        this.meta = null;
        this.fb2 = null;
        this.parsed = null;

        this.linesUp = null;
        this.linesDown = null;
        this.pageLineCount = 0;

        //draw props
        this.textColor = 'black';
        this.backgroundColor = '#478355';
        this.fontStyle = '';// 'bold','italic'
        this.fontSize = 20;// px
        this.fontName = 'arial';
        this.lineInterval = 5;// px
        this.textAlignJustify = true;

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

                this.calcDrawProps();
                const parsed = this.book.parsed;
                parsed.p = 30;// px, отступ параграфа
                parsed.w = this.canvas.width;// px, ширина страницы
                parsed.font = this.font;
                parsed.measureText = (text, style) => {// eslint-disable-line no-unused-vars
                    return this.context.measureText(text).width;
                };
                this.measureText = parsed.measureText;

                this.parsed = parsed;
                this.drawPage();
            })();
        }
    }

    get font() {
        return `${this.fontStyle} ${this.fontSize}px ${this.fontName}`;
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
                paraBegin: Boolean,
                paraEnd: Boolean,
                parts: array of {
                    style: 'bold'|'italic',
                    text: String,
                }
            }*/

            let text = '';
            for (const part of line.parts) {
                text += part.text;
            }

            y += this.lineHeight;
            let filled = false;
            if (this.textAlignJustify && !line.paraEnd) {
                const words = text.split(' ');
                if (words.length > 1) {
                    let space = canvas.width - line.width + spaceWidth*(words.length - 1);
                    space = space/(words.length - 1);

                    let x = 0;
                    for (const word of words) {
                        context.fillText(word, x, y);
                        x += this.measureText(word) + space;
                    }
                    filled = true;
                }
            }

            if (!filled)
                context.fillText(text, 0, y);
            
        }

        this.linesUp = this.parsed.getLines(this.bookPos, -(this.pageLineCount + 1));
        this.linesDown = lines;
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
            switch (event.key) {
                case 'PageDown': 
                    this.doPageDown();
                    break;
                case 'PageUp':
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
    display: flex;
    flex-direction: column;
}

.canvas {
}

pre {
    margin: 0;
    padding: 0;
}
p {
    margin: 0;
    padding: 0;
}
</style>