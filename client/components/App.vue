<template>
    <div class="fit row">
        <Notify ref="notify" />
        <StdDialog ref="stdDialog" />

        <router-view v-slot="{ Component }">
            <keep-alive v-if="showPage">
                <component :is="Component" class="col" />
            </keep-alive>
        </router-view>
    </div>
</template>

<script>
//-----------------------------------------------------------------------------
import vueComponent from './vueComponent.js';

import Notify from './share/Notify.vue';
import StdDialog from './share/StdDialog.vue';
import sanitizeHtml from 'sanitize-html';

import miscApi from '../api/misc';

const componentOptions = {
    components: {
        Notify,
        StdDialog,
    },
    watch: {
        mode: function() {
            this.setAppTitle();
            this.redirectIfNeeded();
        },
        nightMode() {
            this.setNightMode();
        },
    },

};
class App {
    _options = componentOptions;
    showPage = false;

    created() {
        this.commit = this.$store.commit;
        this.state = this.$store.state;
        this.uistate = this.$store.state.uistate;
        this.config = this.$store.state.config;

        //dark mode
        let darkMode = null;
        this.$root.setDarkMode = (value) => {
            if (darkMode !== value) {
                const vars = [
                    '--bg-app-color', '--text-app-color', '--bg-dialog-color', '--text-anchor-color',
                    '--bg-loader-color', '--bg-input-color', '--bg-btn-color1', '--bg-btn-color2',
                    '--bg-header-color1', '--bg-header-color2', '--bg-header-color3',
                    '--bg-menu-color1', '--bg-menu-color2', '--text-menu-color',
                    '--text-tb-normal', '--bg-tb-normal', '--bg-tb-hover',
                    '--text-tb-active', '--bg-tb-active', '--bg-tb-active-hover',
                    '--text-tb-disabled', '--bg-tb-disabled',
                    '--bg-selected-item-color1', '--bg-selected-item-color2',
                ];

                let root = document.querySelector(':root');
                let cs = getComputedStyle(root);

                let mode = (value ? '-dark' : '-light');
                for (const v of vars) {
                    const propValue = cs.getPropertyValue(`${v}${mode}`);
                    root.style.setProperty(v, propValue);
                }

                darkMode = value;
            }
        };

        //root route
        let cachedRoute = '';
        let cachedPath = '';
        this.$root.getRootRoute = () => {
            if (this.$route.path != cachedPath) {
                cachedPath = this.$route.path;
                const m = cachedPath.match(/^(\/[^/]*).*$/i);
                cachedRoute = (m ? m[1] : this.$route.path);

            }
            return cachedRoute;
        };

        this.$router.beforeEach((to, from, next) => {
            //распознавание хоста, если присутствует домен 3-уровня "b.", то разрешена только определенная страница
            if (window.location.host.indexOf('b.') == 0 && to.path != '/external-libs' && to.path != '/404') {
                next('/404');
            } else {
                next();
            }
        });

        this.$root.isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent);

        // setAppTitle
        this.$root.setAppTitle = this.setAppTitle;

        //sanitize
        this.$root.sanitize = sanitizeHtml;

        //global event hooks
        this.eventHooks = {};
        this.$root.eventHook = (hookName, event) => {
            if (!this.eventHooks[hookName])
                return;
            for (const hook of this.eventHooks[hookName])
                hook(event);
        }

        this.$root.addEventHook = (hookName, hook) => {
            if (!this.eventHooks[hookName])
                this.eventHooks[hookName] = [];
            if (this.eventHooks[hookName].indexOf(hook) < 0)
                this.eventHooks[hookName].push(hook);
        }

        this.$root.removeEventHook = (hookName, hook) => {
            if (!this.eventHooks[hookName])
                return;
            const i = this.eventHooks[hookName].indexOf(hook);
            if (i >= 0)
                this.eventHooks[hookName].splice(i, 1);
        }

        document.addEventListener('keyup', (event) => {
            this.$root.eventHook('key', event);
        });
        document.addEventListener('keypress', (event) => {
            this.$root.eventHook('key', event);
        });
        document.addEventListener('keydown', (event) => {
            this.$root.eventHook('key', event);
        });

        window.addEventListener('resize', (event) => {
            this.$root.eventHook('resize', event);
        });

        this.setNightMode();
    }

    mounted() {
        this.$root.notify = this.$refs.notify;
        this.$root.stdDialog = this.$refs.stdDialog;

        this.setAppTitle();
        (async() => {
            //загрузим конфиг сервера
            try {
                const config = await miscApi.loadConfig();
                this.commit('config/setConfig', config);
                this.showPage = true;
            } catch(e) {
                //проверим, не получен ли конфиг ранее
                if (!this.mode) {
                    this.$root.notify.error(e.message, 'Ошибка API');
                } else {
                    //вероятно, работаем в оффлайне
                    this.showPage = true;
                }
                console.error(e);
            }

            //запросим persistent storage
            if (navigator.storage && navigator.storage.persist) {
                navigator.storage.persist();
            }
            await this.$router.isReady();
            this.redirectIfNeeded();
        })();
    }

    get apiError() {
        return this.state.apiError;
    }

    get rootRoute() {
        return this.$root.getRootRoute();
    }

    get nightMode() {
        return this.$store.state.reader.settings.nightMode;
    }

    setNightMode() {
        this.$root.setDarkMode(this.nightMode);
        this.$q.dark.set(this.nightMode);
    }

    setAppTitle(title) {
        if (!title) {
            if (this.mode == 'liberama') {
                document.title = `Liberama Reader - всегда с вами`;
            } else if (this.mode == 'omnireader') {
                document.title = `Omni Reader - всегда с вами`;
            } else if (this.config && this.mode !== null) {
                document.title = `Универсальная читалка книг и ресурсов интернета`;
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

    redirectIfNeeded() {
        const search = window.location.search.substr(1);

        //распознавание параметра url вида "?url=<link>" и редирект при необходимости
        const s = search.split('url=');
        const url = s[1] || '';
        if (url) {
            window.history.replaceState({}, '', '/');
            this.$router.replace({ path: '/reader', query: {url} });
        }
    }
}

export default vueComponent(App);
//-----------------------------------------------------------------------------
</script>

<style scoped>
</style>

<style>
/* color schemes */
:root {
    /* current */
    --bg-app-color: #fff;
    --text-app-color: #000;
    --bg-dialog-color: #fff;
    --text-anchor-color: #00f;
    --bg-loader-color: #ebe2c9;
    --bg-input-color: #eee;
    --bg-btn-color1: #1976d2;
    --bg-btn-color2: #eee;
    --bg-header-color1: #007000;
    --bg-header-color2: #59b04f;
    --bg-header-color3: #bbdefb;
    --bg-menu-color1: #eee;
    --bg-menu-color2: #e0e0e0;
    --text-menu-color: #757575;

    --text-tb-normal: #3e843e;
    --bg-tb-normal: #e6edf4;
    --bg-tb-hover: #fff;
    --text-tb-active: #fff;
    --bg-tb-active: #8ab45f;
    --bg-tb-active-hover: #81c581;
    --text-tb-disabled: #d3d3d3;
    --bg-tb-disabled: #808080;

    --bg-selected-item-color1: #b0f0b0;
    --bg-selected-item-color2: #d0f5d0;

    /* light */
    --bg-app-color-light: #fff;
    --text-app-color-light: #000;
    --bg-dialog-color-light: #fff;
    --text-anchor-color-light: #00f;
    --bg-loader-color-light: #ebe2c9;
    --bg-input-color-light: #eee;
    --bg-btn-color1-light: #1976d2;
    --bg-btn-color2-light: #eee;
    --bg-header-color1-light: #007000;
    --bg-header-color2-light: #59b04f;
    --bg-header-color3-light: #bbdefb;
    --bg-menu-color1-light: #eee;
    --bg-menu-color2-light: #e0e0e0;
    --text-menu-color-light: #757575;

    --text-tb-normal-light: #3e843e;
    --bg-tb-normal-light: #e6edf4;
    --bg-tb-hover-light: #fff;
    --text-tb-active-light: #fff;
    --bg-tb-active-light: #8ab45f;
    --bg-tb-active-hover-light: #81c581;
    --text-tb-disabled-light: #d3d3d3;
    --bg-tb-disabled-light: #808080;

    --bg-selected-item-color1-light: #b0f0b0;
    --bg-selected-item-color2-light: #d0f5d0;

    /* dark */
    --bg-app-color-dark: #222;
    --text-app-color-dark: #ccc;
    --bg-dialog-color-dark: #444;
    --text-anchor-color-dark: #09f;
    --bg-loader-color-dark: #222;
    --bg-input-color-dark: #333;
    --bg-btn-color1-dark: #00695c;
    --bg-btn-color2-dark: #333;
    --bg-header-color1-dark: #004000;
    --bg-header-color2-dark: #29901f;
    --bg-header-color3-dark: #335673;
    --bg-menu-color1-dark: #333;
    --bg-menu-color2-dark: #424242;
    --text-menu-color-dark: #858585;
    
    --text-tb-normal-dark: #3e843e;
    --bg-tb-normal-dark: #c6cde4;
    --bg-tb-hover-dark: #ddd;
    --text-tb-active-dark: #ddd;
    --bg-tb-active-dark: #7aa44f;
    --bg-tb-active-hover-dark: #71b571;
    --text-tb-disabled-dark: #d3d3d3;
    --bg-tb-disabled-dark: #808080;

    --bg-selected-item-color1-dark: #605020;
    --bg-selected-item-color2-dark: #403010;
}

a {
    color: var(--text-anchor-color);
}

.bg-app, .text-bg-app {
    background-color: var(--bg-app-color);
}

.text-app {
    color: var(--text-app-color);
}

.bg-dialog {
    background-color: var(--bg-dialog-color);
}

.bg-input {
    background-color: var(--bg-input-color);
}

.bg-btn1 {
    background-color: var(--bg-btn-color1);
}

.bg-btn2 {
    background-color: var(--bg-btn-color2);
}

.bg-menu-1 {
    background-color: var(--bg-menu-color1);
}

.bg-menu-2 {
    background-color: var(--bg-menu-color2);
}

.text-menu {
    color: var(--text-menu-color);
}

.bg-header-3 {
    background-color: var(--bg-header-color3);
}

/* main section */
body, html, #app {    
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    font: normal 12pt ReaderDefault;
    background-color: #333;
}

.q-notifications__list--top {
    top: 55px !important;
}

.dborder {
    border: 2px solid magenta !important;
}

.icon-rotate {
    vertical-align: middle;
    animation: rotating 2s linear infinite;
}

@keyframes rotating { 
    from { 
        transform: rotate(0deg); 
    } to { 
        transform: rotate(360deg); 
    }
}

.notify-button-icon {
    font-size: 16px !important;
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
