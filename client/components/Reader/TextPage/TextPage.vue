<template>
    <div ref="main" class="main">
        <pre>{{ this.lastOpenedBook }}</pre>
        <pre>{{ meta }}</pre>
        <pre>{{ bookPos }}</pre>
        <pre>{{ $route.query }}</pre>
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
            this.updateRoute(newValue);
            this.commit('reader/setOpenedBook', Object.assign({}, this.lastOpenedBook, {bookPos: newValue}));
            this.drawPage();
        },
        routeParamPos: function(newValue) {
            if (newValue !== undefined && newValue != this.bookPos) {
                this.bookPos = newValue;
            }
        },
    },
})
class TextPage extends Vue {
    meta = null;
    fb2 = null;
    bookPos = 0;

    created() {
        this.commit = this.$store.commit;
        this.dispatch = this.$store.dispatch;
        this.config = this.$store.state.config;
        this.reader = this.$store.state.reader;

        this.lastOpenTry = '';
    }

    activated() {
        this.$refs.main.focus();
        this.book = null;
        this.meta = null;
        this.fb2 = null;

        let last = this.lastOpenedBook;

        if (last && !(this.routeParamUrl && this.routeParamUrl != last.url)) {
            (async() => {
                const isParsed = await bookManager.hasBookParsed(last);
                if (!isParsed) {
                    this.$root.$emit('set-app-title');
                    if (this.lastOpenTry != last.url) {
                        this.$emit('parse-book', last);
                        this.lastOpenTry = last.url;
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

                this.bookPos = (this.routeParamPos !== undefined ? this.routeParamPos : last.bookPos || 0);
                this.updateRoute(this.bookPos);
                this.drawPage();
            })();
        }
    }

    get lastOpenedBook() {
        return this.$store.getters['reader/lastOpenedBook'];
    }

    get routeParamUrl() {
        let result = '';
        const path = this.$route.fullPath;
        const i = path.indexOf('url=');
        if (i >= 0) {
            result = path.substr(i + 4);
        }
        
        return decodeURIComponent(result);
    }

    get routeParamPos() {
        let result = undefined;
        const q = this.$route.query;
        if (q['__p']) {
            result = q['__p'];
            if (Array.isArray(result))
                result = result[0];
        }
        
        return (result ? parseInt(result, 10) || 0 : result);
    }

    updateRoute(newPos) {
        if (this.book)
            this.$router.replace(`/reader?__p=${newPos}&url=${this.lastOpenedBook.url}`);
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