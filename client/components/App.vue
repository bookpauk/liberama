<template>
    <el-container>
        <el-aside v-if="showAsideBar" :width="asideWidth">
            <div class="app-name"><span v-html="appName"></span></div>
            <el-button class="el-button-collapse" @click="toggleCollapse" :icon="buttonCollapseIcon"></el-button>
            <el-menu class="el-menu-vertical" :default-active="rootRoute" :collapse="isCollapse" router>
              <el-menu-item index="/cardindex">
                <i class="el-icon-search"></i>
                <span :class="itemTitleClass('/cardindex')" slot="title">{{ this.itemRuText['/cardindex'] }}</span>
              </el-menu-item>
              <el-menu-item index="/reader">
                <i class="el-icon-tickets"></i>
                <span :class="itemTitleClass('/reader')" slot="title">{{ this.itemRuText['/reader'] }}</span>
              </el-menu-item>
              <el-menu-item index="/forum" disabled>
                <i class="el-icon-message"></i>
                <span :class="itemTitleClass('/forum')" slot="title">{{ this.itemRuText['/forum'] }}</span>
              </el-menu-item>
              <el-menu-item index="/income">
                <i class="el-icon-upload"></i>
                <span :class="itemTitleClass('/income')" slot="title">{{ this.itemRuText['/income'] }}</span>
              </el-menu-item>
              <el-menu-item index="/sources">
                <i class="el-icon-menu"></i>
                <span :class="itemTitleClass('/sources')" slot="title">{{ this.itemRuText['/sources'] }}</span>
              </el-menu-item>
              <el-menu-item index="/settings">
                <i class="el-icon-setting"></i>
                <span :class="itemTitleClass('/settings')" slot="title">{{ this.itemRuText['/settings'] }}</span>
              </el-menu-item>
              <el-menu-item index="/help">
                <i class="el-icon-question"></i>
                <span :class="itemTitleClass('/help')" slot="title">{{ this.itemRuText['/help'] }}</span>
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
import * as utils from '../share/utils';

export default @Component({
    watch: {
        mode: function() {
            this.setAppTitle();
            this.redirectIfNeeded();
        }
    },

})
class App extends Vue {
    itemRuText = {
        '/cardindex': 'Картотека',
        '/reader': 'Читалка',
        '/forum': 'Форум-чат',
        '/income': 'Поступления',
        '/sources': 'Источники',
        '/settings': 'Параметры',
        '/help': 'Справка',
    }
    created() {
        this.commit = this.$store.commit;
        this.dispatch = this.$store.dispatch;
        this.state = this.$store.state;
        this.uistate = this.$store.state.uistate;
        this.config = this.$store.state.config;

        // set-app-title
        this.$root.$on('set-app-title', this.setAppTitle);

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
        window.addEventListener('resize', () => {
            this.$root.$emit('resize');
        });
    }

    mounted() {
        this.dispatch('config/loadConfig');
        this.$watch('apiError', function(newError) {
            if (newError) {
                let mes = newError.message;
                if (newError.response && newError.response.config)
                    mes = newError.response.config.url + '<br>' + newError.response.statusText;
                this.$notify.error({
                    title: 'Ошибка API',
                    dangerouslyUseHTMLString: true,
                    message: mes
                });
            }
        });

        this.setAppTitle();
        this.redirectIfNeeded();
    }

    toggleCollapse() {
        this.commit('uistate/setAsideBarCollapse', !this.uistate.asideBarCollapse);
        this.$root.$emit('resize');
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
        this.$root.rootRoute = (m ? m[1] : this.$route.path);

        return this.$root.rootRoute;
    }

    setAppTitle(title) {
        if (!title) {
            if (this.mode == 'omnireader') {
                document.title = `Omni Reader - всегда с вами`;
            } else if (this.config && this.mode !== null) {
                document.title = `${this.config.name} - ${this.itemRuText[this.$root.rootRoute]}`;
            }
        } else {
            document.title = title;
        }
    }

    itemTitleClass(path) {
        return (this.rootRoute == path ? {'bold-font': true} : {});
    }

    get mode() {
        return this.$store.state.config.mode;
    }

    get showAsideBar() {
        return (this.mode !== null && this.mode != 'reader' && this.mode != 'omnireader');
    }

    get isReaderActive() {
        return this.rootRoute == '/reader';
    }

    get showMain() {
        return (this.showAsideBar || this.isReaderActive);
    }

    redirectIfNeeded() {
        if ((this.mode == 'reader' || this.mode == 'omnireader') && (!this.isReaderActive)) {
            //старый url
            const search = window.location.search.substr(1);
            const s = search.split('url=');
            const url = s[1] || '';
            const q = utils.parseQuery(s[0] || '');
            if (url) {
                q.url = decodeURIComponent(url);
            }

            window.history.replaceState({}, '', '/');
            this.$router.replace({ path: '/reader', query: q });
        }

        //yandex-метрика для omnireader
        if (this.config.branch == 'production' && this.mode == 'omnireader' && !this.yaMetricsDone) {
            (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
            m[i].l=1*new Date();k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
            (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");// eslint-disable-line no-unexpected-multiline

            ym(52347334, "init", {// eslint-disable-line no-undef
                id:52347334,
                clickmap:true,
                trackLinks:true,
                accurateTrackBounce:true
            });

            this.yaMetricsDone = true;
        }
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
    font: normal 12pt ReaderDefault;
}

.el-tabs__content {
    flex: 1;
    padding: 0 !important;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

@font-face {
  font-family: 'ReaderDefault';
  src: url('fonts/reader-default.woff') format('woff'),
       url('fonts/reader-default.ttf') format('truetype');
}

@font-face {
  font-family: 'OpenSans';
  src: url('fonts/open-sans.woff') format('woff'),
       url('fonts/open-sans.ttf') format('truetype');
}

@font-face {
  font-family: 'Roboto';
  src: url('fonts/roboto.woff') format('woff'),
       url('fonts/roboto.ttf') format('truetype');
}

@font-face {
  font-family: 'Rubik';
  src: url('fonts/rubik.woff2') format('woff2');
}

@font-face {
  font-family: 'Avrile';
  src: url('fonts/avrile.woff') format('woff'),
       url('fonts/avrile.ttf') format('truetype');
}

@font-face {
  font-family: 'Arimo';
  src: url('fonts/arimo.woff2') format('woff2');
}

@font-face {
  font-family: 'GEO_1';
  src: url('fonts/geo_1.woff') format('woff'),
       url('fonts/geo_1.ttf') format('truetype');
}

</style>
