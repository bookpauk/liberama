<template>
    <div ref="main" class="main">
        <!--pre>{{ meta }}</pre-->
        <p v-for="item in items" :key="item.id">
            {{ item.text }}
        </p>        
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
            this.$emit('book-pos-changed', {bookPos: newValue});
            this.drawPage();
        },
    },
})
class TextPage extends Vue {
    meta = null;
    lastBook = null;
    bookPos = 0;

    items = null;

    created() {
        this.commit = this.$store.commit;
        this.dispatch = this.$store.dispatch;
        this.config = this.$store.state.config;
        this.reader = this.$store.state.reader;
    }

    showBook() {
        this.$refs.main.focus();
        this.book = null;
        this.meta = null;
        this.fb2 = null;
        this.parsed = null;

        this.drawPage();//пока не загрузили, очистим канвас

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
                parsed.p = 30;//px, отступ параграфа
                parsed.w = 300;//px, ширина страницы
                parsed.measureText = (text, style) => {
                    if (style == 'bold')
                        return text.length*12;
                    else
                        return text.length*3;
                };                

                this.parsed = parsed;
                this.drawPage();
            })();
        }
    }

    drawPage() {
        if (!this.lastBook)
            return;

        //пустой канвас
        this.items = [];

        if (!this.book)
            return;
        const lines = this.parsed.getLines(this.bookPos, 30);

        let newItems = [];
        for (const line of lines) {
console.log(line);
            /* line:
            {
                begin: Number,
                end: Number,
                parts: array of {
                    style: 'bold'|'italic',
                    text: String,
                }
            }*/

            const item = {text: '', id: line.begin};
            for (const part of line.parts) {
                item.text += part.text;
            }
            newItems.push(item);
        }
        this.items = newItems;
    }

    keyHook(event) {
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

p {
    margin: 0;
    padding: 0;
}
</style>