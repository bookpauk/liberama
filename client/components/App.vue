<template>
    <el-container>
        <el-aside v-if="showAsideBar" :width="asideWidth">
            <div class="app-name"><span v-html="appName"></span></div>
            <el-button class="el-button-collapse" @click="toggleCollapse" :icon="buttonCollapseIcon"></el-button>
            <el-menu class="el-menu-vertical" :default-active="rootRoute" :collapse="isCollapse" router>
              <el-menu-item index="/cardindex">
                <i class="el-icon-search"></i>
                <span :class="itemTitleClass('/cardindex')" slot="title">Картотека</span>
              </el-menu-item>
              <el-menu-item index="/reader">
                <i class="el-icon-tickets"></i>
                <span :class="itemTitleClass('/reader')" slot="title">Читалка</span>
              </el-menu-item>
              <el-menu-item index="/forum" disabled>
                <i class="el-icon-message"></i>
                <span :class="itemTitleClass('/forum')" slot="title">Форум-чат</span>
              </el-menu-item>
              <el-menu-item index="/income">
                <i class="el-icon-upload"></i>
                <span :class="itemTitleClass('/income')" slot="title">Поступления</span>
              </el-menu-item>
              <el-menu-item index="/sources">
                <i class="el-icon-menu"></i>
                <span :class="itemTitleClass('/sources')" slot="title">Источники</span>
              </el-menu-item>
              <el-menu-item index="/settings">
                <i class="el-icon-setting"></i>
                <span :class="itemTitleClass('/settings')" slot="title">Параметры</span>
              </el-menu-item>
              <el-menu-item index="/help">
                <i class="el-icon-question"></i>
                <span :class="itemTitleClass('/help')" slot="title">Справка</span>
              </el-menu-item>
            </el-menu>
        </el-aside>

        <el-main v-if="showMain" :style="{padding: (isReaderActive ? 0 : '5px')}">
            <keep-alive>
                <router-view></router-view>
            </keep-alive>
        </el-main>
    </el-container>
</template>

<script>
//-----------------------------------------------------------------------------
import Vue from 'vue';
import Component from 'vue-class-component';

export default @Component({
    watch: {
        rootRoute: function(newValue) {
            if ((this.mode == 'reader' || this.mode == 'omnireader') && (newValue != '/reader')) {
                this.$router.replace('/reader');
            }
        },
    },

})
class App extends Vue {
    created() {
        this.commit = this.$store.commit;
        this.dispatch = this.$store.dispatch;
        this.state = this.$store.state;
        this.uistate = this.$store.state.uistate;
        this.config = this.$store.state.config;

        //global keyHooks
        this.keyHooks = [];
        this.keyHook = (event) => {
            for (const hook of this.keyHooks)
                hook(event);
        }

        this.$root.addKeyHook = (hook) => {
            if (this.keyHooks.indexOf(hook) < 0)
                this.keyHooks.push(hook);
        }

        this.$root.removeKeyHook = (hook) => {
            const i = this.keyHooks.indexOf(hook);
            if (i >= 0)
                this.keyHooks.splice(i, 1);
        }

        document.addEventListener('keyup', (event) => {
            this.keyHook(event);
        });        
        document.addEventListener('keydown', (event) => {
            this.keyHook(event);
        });        
    }

    mounted() {
        this.dispatch('config/loadConfig');
        this.$watch('apiError', function(newError) {
            if (newError) {
                this.$notify.error({
                    title: 'Ошибка API',
                    dangerouslyUseHTMLString: true,
                    message: newError.response.config.url + '<br>' + newError.response.statusText
                });
            }
        });
    }

    toggleCollapse() {
        this.commit('uistate/setAsideBarCollapse', !this.uistate.asideBarCollapse);
    }

    get isCollapse() {
        return this.uistate.asideBarCollapse;
    }

    get asideWidth() {
        if (this.uistate.asideBarCollapse) {
            return '64px';
        } else {
            return '170px';
        }
    }

    get buttonCollapseIcon() {
        if (this.uistate.asideBarCollapse) {
            return 'el-icon-d-arrow-right';
        } else {
            return 'el-icon-d-arrow-left';
        }
    }

    get appName() {
        if (this.isCollapse)
            return '<br><br>';
        else
            return `${this.config.name} <br>v${this.config.version}`;
    }

    get apiError() {
        return this.state.apiError;
    }

    get rootRoute() {
        const m = this.$route.path.match(/^(\/[^/]*).*$/i);
        return (m ? m[1] : this.$route.path);
    }

    itemTitleClass(path) {
        return (this.rootRoute == path ? {'bold-font': true} : {});
    }

    get mode() {
        return this.config.mode;
    }

    get showAsideBar() {
        return (this.mode != 'reader' && this.mode != 'omnireader');
    }

    get isReaderActive() {
        return this.rootRoute == '/reader';
    }

    get showMain() {
        return (this.showAsideBar || this.isReaderActive);
    }
}
//-----------------------------------------------------------------------------
</script>

<style scoped>
.app-name {
    margin-left: 10px;
    margin-top: 10px;
    text-align: center;
    line-height: 140%;
    font-weight: bold;
}

.bold-font {
    font-weight: bold;
}

.el-container {
    height: 100%;
}

.el-aside {
    line-height: 1;
    background-color: #ccc;
    color: #000;
}

.el-main {
    padding: 0;
    background-color: #E6EDF4;
    color: #000;
}

.el-menu-vertical:not(.el-menu--collapse) {
    background-color: inherit;
    color: inherit;
    text-align: left;
    width: 100%;
    border: 0;
}

.el-menu--collapse {
    background-color: inherit;
    color: inherit;
    border: 0;
}

.el-button-collapse, .el-button-collapse:focus, .el-button-collapse:active, .el-button-collapse:hover {
    background-color: inherit;
    color: inherit;
    margin-top: 5px;
    width: 100%;
    height: 64px;
    border: 0;
}
.el-menu-item {
    font-size: 85%;
}
</style>

<style>
body, html, #app {
    margin: 0;
    padding: 0;
    height: 100%;
    font: normal 12pt Arial, Verdana, Sans-serif;
}
</style>
