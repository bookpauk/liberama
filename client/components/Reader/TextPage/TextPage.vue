<template>
    <div class="main">
        <p v-for="item in items" :key="item.id">
            {{ item.text }}
        </p>
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
                    this.$emit('parse-book', last);
                    return;
                }
                const book = await bookManager.getBook(last);
                this.book = book.parsed;

                let lines = [];
                const len = (this.book.para.length > 50 ? 50 : this.book.para.length);
                for (let i = 0; i < len; i++) {
                    lines.push({key: i, text: this.book.para[i].text});
                }
                this.items = lines;
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