<template>
    <div class="main">
        <pre>{{ parsedBook }}</pre>
    </div>
</template>

<script>
//-----------------------------------------------------------------------------
import Vue from 'vue';
import Component from 'vue-class-component';
import bookManager from '../share/bookManager';

export default @Component({
})
class TextPage extends Vue {
    parsedBook = null;

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
                    this.$emit('parse-book', last);
                    return;
                }
                const book = await bookManager.getBook(last);
                this.book = book.parsed;
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
</style>