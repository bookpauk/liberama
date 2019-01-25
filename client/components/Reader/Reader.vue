<template>
    <el-container>
        <el-header v-show="toolBarActive" height='50px'>
            <div class="header">
                <el-tooltip content="Загрузить книгу" :open-delay="1000" effect="light">
                    <el-button ref="loader" class="tool-button" :class="buttonActiveClass('loader')" @click="buttonClick('loader')"><i class="el-icon-back"></i></el-button>
                </el-tooltip>

                <div>
                    <el-tooltip content="Действие назад" :open-delay="1000" effect="light">
                        <el-button ref="undoAction" class="tool-button" @click="buttonClick('undoAction')" ><i class="el-icon-arrow-left"></i></el-button>
                    </el-tooltip>
                    <el-tooltip content="Действие вперед" :open-delay="1000" effect="light">
                        <el-button ref="redoAction" class="tool-button" @click="buttonClick('redoAction')" ><i class="el-icon-arrow-right"></i></el-button>
                    </el-tooltip>
                    <div class="space"></div>
                    <el-tooltip content="На весь экран" :open-delay="1000" effect="light">
                        <el-button ref="fullScreen" class="tool-button" :class="buttonActiveClass('fullScreen')" @click="buttonClick('fullScreen')"><i class="el-icon-rank"></i></el-button>
                    </el-tooltip>
                    <el-tooltip content="Прокрутка книги" :open-delay="1000" effect="light">
                        <el-button ref="setPosition" class="tool-button" @click="buttonClick('setPosition')"><i class="el-icon-d-arrow-right"></i></el-button>
                    </el-tooltip>
                    <el-tooltip content="Плавный скроллинг" :open-delay="1000" effect="light">
                        <el-button ref="scrolling" class="tool-button" @click="buttonClick('scrolling')"><i class="el-icon-sort"></i></el-button>
                    </el-tooltip>
                    <el-tooltip content="Найти в тексте" :open-delay="1000" effect="light">
                        <el-button ref="search" class="tool-button" @click="buttonClick('search')"><i class="el-icon-search"></i></el-button>
                    </el-tooltip>
                    <el-tooltip content="Скопировать текст со страницы" :open-delay="1000" effect="light">
                        <el-button ref="copyText" class="tool-button" @click="buttonClick('copyText')"><i class="el-icon-edit-outline"></i></el-button>
                    </el-tooltip>
                    <el-tooltip content="Принудительно обновить книгу в обход кеша" :open-delay="1000" effect="light">
                        <el-button ref="refresh" class="tool-button" @click="buttonClick('refresh')"><i class="el-icon-refresh"></i></el-button>                
                    </el-tooltip>
                    <div class="space"></div>
                    <el-tooltip content="История" :open-delay="1000" effect="light">
                        <el-button ref="history" class="tool-button" :class="buttonActiveClass('history')" @click="buttonClick('history')"><i class="el-icon-document"></i></el-button>
                    </el-tooltip>
                </div>

                <el-tooltip content="Настроить" :open-delay="1000" effect="light">
                    <el-button ref="settings" class="tool-button" @click="buttonClick('settings')"><i class="el-icon-setting"></i></el-button>            
                </el-tooltip>
            </div>
        </el-header>

        <el-main>
            <keep-alive>
                <component ref="page" :is="pageActive" @load-book="loadBook" @book-pos-changed="bookPosChanged" @tool-bar-toggle="toolBarToggle"></component>
            </keep-alive>
        </el-main>
    </el-container>
</template>

<script>
//-----------------------------------------------------------------------------
import Vue from 'vue';
import Component from 'vue-class-component';
import LoaderPage from './LoaderPage/LoaderPage.vue';
import HistoryPage from './HistoryPage/HistoryPage.vue';
import TextPage from './TextPage/TextPage.vue';
import ProgressPage from './ProgressPage/ProgressPage.vue';

import bookManager from './share/bookManager';
import readerApi from '../../api/reader';

export default @Component({
    components: {
        LoaderPage,
        HistoryPage,
        TextPage,
        ProgressPage
    },
    watch: {
        bookPos: function(newValue) {
            if (newValue !== undefined && this.pageActive == 'TextPage') {
                const textPage = this.$refs.page;
                if (textPage.bookPos != newValue) {
                    textPage.bookPos = newValue;
                }
                if (this.lastOpenedBook && this.lastOpenedBook.bookPos != newValue) {
                    this.commit('reader/setOpenedBook', Object.assign({}, this.lastOpenedBook, {bookPos: newValue}));
                }
            }
        },
        routeParamPos: function(newValue) {
            if (newValue !== undefined && newValue != this.bookPos) {
                this.bookPos = newValue;
            }
        },
        routeParamUrl: function(newValue) {
            if (newValue !== '' && newValue !== this.lastOpenedBook.url) {
                this.loadBook({url: newValue, bookPos: this.routeParamPos});
            }
        },
    },
})
class Reader extends Vue {
    loaderActive = false;
    historyActive = false;

    progressActive = false;
    fullScreenActive = false;

    bookPos = null;
    allowUrlParamBookPos = true;

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
        if (this.$root.rootRoute == '/reader') {
            if (this.routeParamUrl) {
                this.loadBook({url: this.routeParamUrl, bookPos: this.routeParamPos});
            } else if (this.lastOpenedBook) {
                this.loadBook({url: this.lastOpenedBook.url});
            } else {
                this.loaderActive = true;
            }
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

    updateRoute(isNewRoute) {
        const pos = (this.bookPos != undefined && this.allowUrlParamBookPos ? `__p=${this.bookPos}&` : '');
        if (isNewRoute)
            this.$router.push(`/reader?${pos}url=${this.lastOpenedBook.url}`);
        else
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

    get toolBarActive() {
        return this.reader.toolBarActive;
    }

    get lastOpenedBook() {
        return this.$store.getters['reader/lastOpenedBook'];
    }

    toolBarToggle() {
        this.commit('reader/setToolBarActive', !this.toolBarActive);
        this.$root.$emit('resize');
    }

    fullScreenToggle() {
        this.fullScreenActive = !this.fullScreenActive;
        if (this.fullScreenActive) {
            const element = document.documentElement;
            if (element.requestFullscreen) {
                element.requestFullscreen();
            } else if (element.webkitrequestFullscreen) {
                element.webkitRequestFullscreen();
            } else if (element.mozRequestFullscreen) {
                element.mozRequestFullScreen();
            }
        } else {
            if (document.cancelFullScreen) {
                document.cancelFullScreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitCancelFullScreen) {
                document.webkitCancelFullScreen();
            }
        }
    }

    loaderToggle() {
        this.loaderActive = !this.loaderActive;
    }

    historyToggle() {
        this.historyActive = !this.historyActive;
    }

    buttonClick(button) {
        switch (button) {
            case 'loader':
                this.loaderToggle();
                break;
            case 'history':
                this.historyToggle();
                break;
            case 'fullScreen':
                this.fullScreenToggle();
                break;
            case 'refresh':
                if (this.lastOpenedBook) {
                    this.loadBook({url: this.lastOpenedBook.url, force: true});
                }
                break;
        }
        this.$refs[button].$el.blur();
    }

    buttonActiveClass(button) {
        const classActive = { 'tool-button-active': true, 'tool-button-active:hover': true };
        switch (button) {
            case 'loader': return (this.loaderActive ? classActive : {});
            case 'history': return (this.historyActive ? classActive : {});
            case 'fullScreen': return (this.fullScreenActive ? classActive : {});
        }
        return {};
    }

    get pageActive() {
        let result = '';

        if (this.progressActive)
            result = 'ProgressPage';
        else if (this.loaderActive)
            result = 'LoaderPage';
        else if (this.historyActive)
            result = 'HistoryPage';
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
                    return;
                }

                this.updateRoute();
                const textPage = this.$refs.page;
                if (textPage.showBook) {
                    textPage.lastBook = last;
                    textPage.bookPos = (last.bookPos !== undefined ? last.bookPos : 0);

                    textPage.showBook();
                }
            });
        }

        this.$nextTick(() => {
            if (this.$refs.page)
                this.$refs.page.fullScreenToggle = this.fullScreenToggle;
        });

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

                // есть ли среди истории OpenedBook
                const key = bookManager.keyFromUrl(opts.url);
                let wasOpened = this.reader.openedBook[key];
                wasOpened = (wasOpened ? wasOpened : {});
                const bookPos = (opts.bookPos !== undefined ? opts.bookPos : wasOpened.bookPos);

                let book = null;

                if (!opts.force) {
                    // пытаемся загрузить и распарсить книгу в менеджере из локального кеша
                    const bookParsed = await bookManager.getBook({url: opts.url}, (prog) => {
                        progress.setState({progress: prog});
                    });

                    // если есть в локальном кеше
                    if (bookParsed) {
                        this.commit('reader/setOpenedBook', Object.assign({bookPos}, bookManager.metaOnly(bookParsed)));
                        this.loaderActive = false;
                        progress.hide(); this.progressActive = false;
                        return;
                    }

                    // иначе идем на сервер
                    // пытаемся загрузить готовый файл с сервера
                    if (wasOpened.path) {
                        try {
                            const resp = await readerApi.loadCachedBook(wasOpened.path, (state) => {
                                progress.setState(state);
                            });
                            book = Object.assign({}, wasOpened, {data: resp.data});
                        } catch (e) {
                            //молчим
                        }
                    }
                }

                progress.setState({totalSteps: 5});

                // не удалось, скачиваем книгу полностью с конвертацией
                if (!book) {
                    book = await readerApi.loadBook(opts.url, (state) => {
                        progress.setState(state);
                    });
                }

                // добавляем в bookManager
                progress.setState({state: 'parse', step: 5});
                const addedBook = await bookManager.addBook(book, (prog) => {
                    progress.setState({progress: prog});
                });

                // добавляем в историю
                this.commit('reader/setOpenedBook', Object.assign({bookPos}, bookManager.metaOnly(addedBook)));
                this.updateRoute(true);

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
            let handled = false;
            if (this.$refs.page && this.$refs.page.keyHook)
                handled = this.$refs.page.keyHook(event);

            if (!handled && event.type == 'keydown' && event.code == 'Escape') {
                this.loaderToggle();
            }
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
    min-width: 550px;
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