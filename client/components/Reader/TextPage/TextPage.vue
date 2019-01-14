<template>
    <div class="main">
        <pre>{{ meta }}</pre>
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
})
class TextPage extends Vue {
    meta = null;
    fb2 = null;

    items = null;

    created() {
        this.commit = this.$store.commit;
        this.dispatch = this.$store.dispatch;
        this.config = this.$store.state.config;
        this.reader = this.$store.state.reader;

        this.book = null;
    }

    activated() {
        const last = this.lastOpenedBook;
        if (last) {
            (async() => {
                const isParsed = await bookManager.hasBookParsed(last);
                if (!isParsed) {
                    this.$root.$emit('set-app-title');
                    this.$emit('parse-book', last);
                    return;
                }
                this.book = await bookManager.getBook(last);
                this.meta = bookManager.metaOnly(this.book);
                this.fb2 = this.meta.fb2;
                this.$root.$emit('set-app-title', _.compact([
                    this.fb2.lastName,
                    this.fb2.middleName,
                    this.fb2.firstName,
                    '-',
                    this.fb2.bookTitle
                ]).join(' '));                
//
                let lines = [];
                let para = this.book.parsed.para;
                const len = (para.length > 50 ? 50 : para.length);
                for (let i = 0; i < len; i++) {
                    lines.push({key: i, text: para[i].text});
                }
                this.items = lines;
//

            })();
        }
    }

    get lastOpenedBook() {
        return this.$store.getters['reader/lastOpenedBook'];
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
    text-indent: 3%;
}
</style>