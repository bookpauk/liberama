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
                <component :is="componentActive"></component>
            </keep-alive>
        </el-main>
    </el-container>
</template>

<script>
//-----------------------------------------------------------------------------
import Vue from 'vue';
import Component from 'vue-class-component';
import LoaderPage from './LoaderPage/LoaderPage.vue';

export default @Component({
    components: {
        LoaderPage
    },
})
class Reader extends Vue {
    created() {
        this.commit = this.$store.commit;
        this.dispatch = this.$store.dispatch;
        this.reader = this.$store.state.reader;
    }

    get loaderActive() {
        return this.reader.loaderActive;
    }

    get fullScreenActive() {
        return this.reader.fullScreenActive;
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

    get componentActive() {
        let result = '';

        if (!result) {
            this.commit('reader/setLoaderActive', true);
            result = 'LoaderPage';
        }
        return result;
    }
}
//-----------------------------------------------------------------------------
//, .tool-button:focus, .tool-button:active, .tool-button:hover
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