<template>
    <el-container>
        <el-header height='50px'>
            <div class="header">
                <el-tooltip content="Загрузить книгу" :open-delay="1000" effect="light">
                    <el-button class="tool-button" :class="buttonActiveClass('loader')" @click="buttonClick('loader')"><i class="el-icon-back"></i></el-button>
                </el-tooltip>

                <div>
                    <el-tooltip content="Действие назад" :open-delay="1000" effect="light">
                        <el-button class="tool-button" @click="buttonClick('undoAction')" ><i class="el-icon-arrow-left"></i></el-button>
                    </el-tooltip>
                    <el-tooltip content="Действие вперед" :open-delay="1000" effect="light">
                        <el-button class="tool-button" @click="buttonClick('redoAction')" ><i class="el-icon-arrow-right"></i></el-button>
                    </el-tooltip>
                    <div class="space"></div>
                    <el-tooltip content="На весь экран" :open-delay="1000" effect="light">
                        <el-button class="tool-button" :class="buttonActiveClass('fullscreen')" @click="buttonClick('fullscreen')"><i class="el-icon-rank"></i></el-button>
                    </el-tooltip>
                    <el-tooltip content="Прокрутка книги" :open-delay="1000" effect="light">
                        <el-button class="tool-button" @click="buttonClick('setPosition')"><i class="el-icon-d-arrow-right"></i></el-button>
                    </el-tooltip>
                    <el-tooltip content="Плавный скроллинг" :open-delay="1000" effect="light">
                        <el-button class="tool-button" @click="buttonClick('scrolling')"><i class="el-icon-sort"></i></el-button>
                    </el-tooltip>
                    <el-tooltip content="Найти в тексте" :open-delay="1000" effect="light">
                        <el-button class="tool-button" @click="buttonClick('search')"><i class="el-icon-search"></i></el-button>
                    </el-tooltip>
                    <el-tooltip content="Принудительно обновить книгу в обход кеша" :open-delay="1000" effect="light">
                        <el-button class="tool-button" @click="buttonClick('refresh')"><i class="el-icon-refresh"></i></el-button>                
                    </el-tooltip>
                    <div class="space"></div>
                    <el-tooltip content="История" :open-delay="1000" effect="light">
                        <el-button class="tool-button" @click="buttonClick('history')"><i class="el-icon-document"></i></el-button>
                    </el-tooltip>
                </div>

                <el-tooltip content="Настроить" :open-delay="1000" effect="light">
                    <el-button class="tool-button" @click="buttonClick('settings')"><i class="el-icon-setting"></i></el-button>            
                </el-tooltip>
            </div>
        </el-header>

        <el-main>
            {{ bookPos }}
            <keep-alive>
                <component ref="page" :is="pageActive" @load-book="loadBook" @book-pos-changed="bookPosChanged"></component>
            </keep-alive>
        </el-main>
    </el-container>
</template>

<script>
//-----------------------------------------------------------------------------
import Vue from 'vue';
import Component from 'vue-class-component';
import LoaderPage from './LoaderPage/LoaderPage.vue';
import TextPage from './TextPage/TextPage.vue';
import ProgressPage from './ProgressPage/ProgressPage.vue';

import bookManager from './share/bookManager';
import readerApi from '../../api/reader';

export default @Component({
    components: {
        LoaderPage,
        TextPage,
        ProgressPage
    },
    watch: {
        bookPos: function(newValue) {
            if (newValue !== undefined && this.pageActive == 'TextPage') {
                const textPage = this.$refs.page;
                if (textPage.bookPos != newValue) {
                    textPage.bookPos = newValue;
                    this.commit('reader/setOpenedBook', Object.assign({}, this.lastOpenedBook, {bookPos: newValue}));
                }
            }
        },
        routeParamPos: function(newValue) {            
            if (newValue !== undefined && newValue != this.bookPos) {
                this.bookPos = newValue;
            }
        },
    },
})
class Reader extends Vue {
    loaderActive = false;
    progressActive = false;
    bookPos = null;

    created() {
        this.commit = this.$store.commit;
        this.dispatch = this.$store.dispatch;
        this.reader = this.$store.state.reader;

        this.$root.addKeyHook(this.keyHook);

        this.lastActivePage = false;
    }

    mounted() {
        /*while (this.lastOpenedBook) {
            this.commit('reader/delOpenedBook', this.lastOpenedBook);
        }*/
        const lastUrl = (this.lastOpenedBook ? this.lastOpenedBook.url : '');
        if (this.$root.rootRoute == '/reader' && this.routeParamUrl && this.routeParamUrl != lastUrl) {
            this.loaderActive = true;
            this.loadBook({url: this.routeParamUrl, bookPos: this.routeParamPos});
        }        
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

    updateRoute() {
        const pos = (this.bookPos != undefined ? `__p=${this.bookPos}&` : '');
        this.$router.replace(`/reader?${pos}url=${this.lastOpenedBook.url}`);
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

    bookPosChanged(event) {
        this.bookPos = event.bookPos;
        this.updateRoute();
    }

    get fullScreenActive() {
        return this.reader.fullScreenActive;
    }

    get lastOpenedBook() {
        return this.$store.getters['reader/lastOpenedBook'];
    }

    buttonClick(button) {
        switch (button) {
            case 'loader': this.loaderActive = !this.loaderActive; break;
            case 'fullscreen': this.commit('reader/setFullScreenActive', !this.fullScreenActive); break;
        }
    }

    buttonActiveClass(button) {
        const classActive = { 'tool-button-active': true, 'tool-button-active:hover': true };
        switch (button) {
            case 'loader': return (this.loaderActive ? classActive : {});
            case 'fullscreen': return (this.fullScreenActive ? classActive : {});
        }
        return {};
    }

    get pageActive() {
        let result = '';

        if (this.progressActive)
            result = 'ProgressPage';
        else if (this.loaderActive)
            result = 'LoaderPage';
        else if (this.lastOpenedBook)
            result = 'TextPage';

        if (!result) {
            this.loaderActive = true;
            result = 'LoaderPage';
        }

        if (result != 'TextPage') {
            this.$root.$emit('set-app-title');
        }

        if (this.lastActivePage != result && result == 'TextPage') {
            //акивируем страницу с текстом
            this.$nextTick(async() => {
                const last = this.lastOpenedBook;
                const isParsed = await bookManager.hasBookParsed(last);
                if (!isParsed) {
                    this.$root.$emit('set-app-title');
                    this.loadBook({url: last.url, bookPos: last.bookPos});
                    return;
                } else {
                    this.bookPos = last.bookPos;
                }

                const textPage = this.$refs.page;

                textPage.lastBook = last;
                textPage.bookPos = (this.bookPos !== undefined ? this.bookPos : 0);

                textPage.showBook();
            });
        }

        this.lastActivePage = result;
        return result;
    }

    loadBook(opts) {
        this.progressActive = true;
        this.$nextTick(async() => {
            const progress = this.$refs.page;

            try {
                progress.show();
                progress.setState({state: 'parse'});

                const bookParsed = await bookManager.getBook({url: opts.url}, (prog) => {
                    progress.setState({progress: prog});
                });

                if (bookParsed) {
                    this.commit('reader/setOpenedBook', bookManager.metaOnly(bookParsed));
                    this.bookPos = bookParsed.bookPos;
                    this.updateRoute();
                    this.loaderActive = false;
                    progress.hide(); this.progressActive = false;
                    return;
                }

                progress.setState({totalSteps: 5});

                const book = await readerApi.loadBook(opts.url, (state) => {
                    progress.setState(state);
                });

                progress.setState({state: 'parse', step: 5});
                const addedBook = await bookManager.addBook(book, (prog) => {
                    progress.setState({progress: prog});
                });

                this.commit('reader/setOpenedBook', bookManager.metaOnly(addedBook));
                this.bookPos = opts.bookPos;
                this.updateRoute();

                this.loaderActive = false;

                progress.hide(); this.progressActive = false;
            } catch (e) {
                progress.hide(); this.progressActive = false;
                this.loaderActive = true;
                this.$alert(e.message, 'Ошибка', {type: 'error'});
            }
        });
    }

    keyHook(event) {
        if (this.$root.rootRoute == '/reader') {
            if (this.$refs.page && this.$refs.page.keyHook)
                this.$refs.page.keyHook(event);
        }
    }
}
//-----------------------------------------------------------------------------
</script>

<style scoped>
.el-container {
    padding: 0;
    margin: 0;
    height: 100%;
}

.el-header {
    padding-left: 5px;
    padding-right: 5px;
    background-color: #1B695F;
    color: #000;
    overflow-x: auto;
    overflow-y: hidden;
}
  
.header {
    display: flex;
    justify-content: space-between;
    min-width: 500px;
}

.el-main {
    display: flex;
    padding: 0;
    margin: 0;
    background-color: #EBE2C9;
    color: #000;
}

.tool-button {
    margin: 0;
    margin-left: 2px;
    margin-right: 2px;
    padding: 0;
    color: #3E843E;
    background-color: #E6EDF4;
    margin-top: 5px;
    height: 38px;
    width: 38px;
    border: 0;
    box-shadow: 3px 3px 5px black;
}

.tool-button:hover {
    background-color: white;
}

.tool-button-active {
    box-shadow: 0 0 0;
    color: white;
    background-color: #8AB45F;
    position: relative;
    top: 1px;
    left: 1px;
}

.tool-button-active:hover {
    color: white;
    background-color: #81C581;
}

i {
    font-size: 200%;
}

.space {
    width: 10px;
    display: inline-block;
}
</style>