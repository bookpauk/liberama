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
            <keep-alive>
                <component ref="page" :is="pageActive" @load-book="loadBook"></component>
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
})
class Reader extends Vue {
    progressActive = false;

    created() {
        this.commit = this.$store.commit;
        this.dispatch = this.$store.dispatch;
        this.reader = this.$store.state.reader;

        this.$root.addKeyHook(this.keyHook);
    }

    get loaderActive() {
        return this.reader.loaderActive;
    }

    get fullScreenActive() {
        return this.reader.fullScreenActive;
    }

    get lastOpenedBook() {
        return this.$store.getters['reader/lastOpenedBook'];
    }

    buttonClick(button) {
        switch (button) {
            case 'loader': this.commit('reader/setLoaderActive', !this.loaderActive); break;
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
            //this.commit('reader/setLoaderActive', true);
            //result = 'LoaderPage';
        }
        return result;
    }

    loadBook(opts) {
        this.progressActive = true;
        this.$nextTick(async() => {
            const progress = this.$refs.page;
            await progress.show();
            progress.setState({totalSteps: 5});

            try {
                const book = await readerApi.loadBook(opts.url, (state) => {
                    progress.setState(state);
                });

                progress.setState({state: 'parse', step: 5, progress: 0});
                const addedBook = await bookManager.addBook(book, (prog) => {
                    progress.setState({progress: prog});
                });

                this.commit('reader/addOpenedBook', bookManager.metaOnly(addedBook));
                this.commit('reader/setLoaderActive', false);

                this.progressActive = await progress.hide();
            } catch (e) {
                this.progressActive = await progress.hide();
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