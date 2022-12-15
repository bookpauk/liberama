<template>
    <div>
        <router-view v-slot="{ Component }">
            <keep-alive>
                <component :is="Component" />
            </keep-alive>
        </router-view>        
    </div>
</template>

<script>
//-----------------------------------------------------------------------------
import vueComponent from '../vueComponent.js';
import _ from 'lodash';

const selfRoute = '/cardindex';
const tab2Route = [
    '/cardindex/search',
    '/cardindex/card',
    '/cardindex/book',
    '/cardindex/history',
];
let lastActiveTab = null;

const componentOptions = {
    watch: {
        selectedTab: function(newValue) {
            lastActiveTab = newValue;
            this.setRouteByTab(newValue);
        },
        curRoute: function(newValue) {
            this.setTabByRoute(newValue);
        },
    },
};
class CardIndex {
    _options = componentOptions;
    selectedTab = null;

    created() {
        this.$watch(
            () => this.$route.path,
            (newValue) => {
                if (newValue == '/cardindex' && this.isReader) {
                    this.$router.replace({ path: '/reader' });
                }
            }
        )
    }

    mounted() {
        this.setTabByRoute(this.curRoute);
    }

    setTabByRoute(route) {
        const t = _.indexOf(tab2Route, route);
        if (t >= 0) {
            if (t !== this.selectedTab)
                this.selectedTab = t.toString();
        } else {
            if (route == selfRoute && lastActiveTab !== null)
                this.setRouteByTab(lastActiveTab);
        }
    }

    setRouteByTab(tab) {
        const t = Number(tab);
        if (tab2Route[t] !== this.curRoute) {
            this.$router.replace(tab2Route[t]);
        }
    }

    get mode() {
        return this.$store.state.config.mode;
    }

    get curRoute() {
        const m = this.$route.path.match(/^(\/[^/]*\/[^/]*).*$/i);
        return (m ? m[1] : this.$route.path);
    }

    get isReader() {
        return (this.mode !== null && (this.mode == 'reader' || this.mode == 'omnireader' || this.mode == 'liberama'));
    }

}

export default vueComponent(CardIndex);
//-----------------------------------------------------------------------------
</script>

<style scoped>
</style>