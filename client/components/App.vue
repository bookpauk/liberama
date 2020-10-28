<template>
    <div class="fit row">
        <Notify ref="notify"/>
        <StdDialog ref="stdDialog"/>
        <keep-alive>
            <router-view class="col"></router-view>
        </keep-alive>
    </div>
</template>

<script>
//-----------------------------------------------------------------------------
import Vue from 'vue';
import Component from 'vue-class-component';
import Notify from './share/Notify.vue';
import StdDialog from './share/StdDialog.vue';
import * as utils from '../share/utils';

export default @Component({
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
    };

    created() {
        this.commit = this.$store.commit;
        this.dispatch = this.$store.dispatch;
        this.state = this.$store.state;
        this.uistate = this.$store.state.uistate;
        this.config = this.$store.state.config;

        //root route
        let cachedRoute = '';
        let cachedPath = '';
        this.$root.rootRoute = () => {
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

    routerReady() {
        return new Promise ((resolve) => {
            this.$router.onReady(() => {
                resolve();
            });
        });
    }

    mounted() {
        this.$root.notify = this.$refs.notify;
        this.$root.stdDialog = this.$refs.stdDialog;

        this.dispatch('config/loadConfig');
        this.$watch('apiError', function(newError) {
            if (newError) {
                let mes = newError.message;
                if (newError.response && newError.response.config)
                    mes = newError.response.config.url + '<br>' + newError.response.statusText;
                this.$root.notify.error(mes, 'Ошибка API');
            }
        });

        this.setAppTitle();
        (async() => {
            await this.routerReady();
            this.redirectIfNeeded();
        })();
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
        return this.$root.rootRoute();
    }

    setAppTitle(title) {
        if (!title) {
            if (this.mode == 'liberama.top') {
                document.title = `Liberama Reader - всегда с вами`;
            } else if (this.mode == 'omnireader') {
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
        return (this.mode !== null && this.mode != 'reader' && this.mode != 'omnireader' && this.mode != 'liberama.top');
    }

    set showAsideBar(value) {
    }

    get isReaderActive() {
        return (this.rootRoute == '/reader' || this.rootRoute == '/external-libs');
    }

    redirectIfNeeded() {
        if ((this.mode == 'reader' || this.mode == 'omnireader' || this.mode == 'liberama.top')) {
            const search = window.location.search.substr(1);

            //распознавание параметра url вида "?url=<link>" и редирект при необходимости
            if (!this.isReaderActive) {
                const s = search.split('url=');
                const url = s[1] || '';
                const q = utils.parseQuery(s[0] || '');
                if (url) {
                    q.url = decodeURIComponent(url);
                }

                window.history.replaceState({}, '', '/');
                this.$router.replace({ path: '/reader', query: q });
            }
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
</style>

<style>
body, html, #app {    
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    font: normal 12pt ReaderDefault;
}

.dborder {
    border: 2px solid yellow !important;
}

.icon-rotate {
    vertical-align: middle;
    animation: rotating 2s linear infinite;
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
