<template>
    <div class="main">
        <pre>{{ meta }}</pre>
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

    created() {
        this.commit = this.$store.commit;
        this.dispatch = this.$store.dispatch;
        this.config = this.$store.state.config;
        this.reader = this.$store.state.reader;

        this.openFailed = false;
    }

    activated() {
        this.book = null;
        this.meta = null;
        this.fb2 = null;

        const last = this.lastOpenedBook;
        if (last) {
            (async() => {
                const isParsed = await bookManager.hasBookParsed(last);
                if (!isParsed) {
                    this.$root.$emit('set-app-title');
                    if (!this.openFailed) {
                        this.$emit('parse-book', last);
                        this.openFailed = true;
                    }
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

                this.drawPage();
            })();
        }
    }

    get lastOpenedBook() {
        return this.$store.getters['reader/lastOpenedBook'];
    }

    drawPage() {
        const last = this.lastOpenedBook;
        if (!last)
            return;

        //пустой канвас

        if (!this.book)
            return;


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
</style>