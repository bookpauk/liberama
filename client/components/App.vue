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
import * as utils from '../share/utils';

const componentOptions = {
    components: {
        Notify,
        StdDialog,
    },
    watch: {
        mode: function() {
            this.setAppTitle();
            this.redirectIfNeeded();
        }
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
        }

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
    }

    mounted() {
        this.$root.notify = this.$refs.notify;
        this.$root.stdDialog = this.$refs.stdDialog;

        this.setAppTitle();
        (async() => {
            //загрузим конфиг сревера
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

    toggleCollapse() {
        this.commit('uistate/setAsideBarCollapse', !this.uistate.asideBarCollapse);
        this.$root.eventHook('resize');
    }

    get isCollapse() {
        return this.uistate.asideBarCollapse;
    }

    get asideWidth() {
        if (this.uistate.asideBarCollapse) {
            return 64;
        } else {
            return 170;
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
        return this.$root.getRootRoute();
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

    get isReaderActive() {
        return (this.rootRoute == '/reader' || this.rootRoute == '/external-libs');
    }

    redirectIfNeeded() {
        if ((this.mode == 'reader' || this.mode == 'omnireader' || this.mode == 'liberama')) {
            const search = window.location.search.substr(1);

            //распознавание параметра url вида "?url=<link>" и редирект при необходимости
            if (!this.isReaderActive) {
                const s = search.split('url=');
                const url = s[1] || '';
                const q = utils.parseQuery(s[0] || '');
                if (url) {
                    q.url = url;
                }

                window.history.replaceState({}, '', '/');
                this.$router.replace({ path: '/reader', query: q });
            }
        }
    }
}

export default vueComponent(App);
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
</style>

<style>
body, html, #app {    
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    font: normal 12pt ReaderDefault;
}

.notify-margin {
    margin-top: 55px;
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
