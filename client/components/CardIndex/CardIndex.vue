<template>
    <q-page>
        <keep-alive>
            <router-view></router-view>
        </keep-alive>
    </q-page>
</template>

<script>
//-----------------------------------------------------------------------------
import Vue from 'vue';
import Component from 'vue-class-component';
import _ from 'lodash';

const rootRoute = '/cardindex';
const tab2Route = [
    '/cardindex/search',
    '/cardindex/card',
    '/cardindex/book',
    '/cardindex/history',
];
let lastActiveTab = null;

export default @Component({
    watch: {
        selectedTab: function(newValue, oldValue) {
            lastActiveTab = newValue;
            this.setRouteByTab(newValue);
        },
        curRoute: function(newValue, oldValue) {
            this.setTabByRoute(newValue);
        },
    },
})
class CardIndex extends Vue {
    selectedTab = null;

    mounted() {
        this.setTabByRoute(this.curRoute);
    }

    setTabByRoute(route) {
        const t = _.indexOf(tab2Route, route);
        if (t >= 0) {
            if (t !== this.selectedTab)
                this.selectedTab = t.toString();
        } else {
            if (route == rootRoute && lastActiveTab !== null)
                this.setRouteByTab(lastActiveTab);
        }
    }

    setRouteByTab(tab) {
        const t = Number(tab);
        if (tab2Route[t] !== this.curRoute) {
            this.$router.replace(tab2Route[t]);
        }
    }

    get curRoute() {
        const m = this.$route.path.match(/^(\/[^\/]*\/[^\/]*).*$/i);
        return (m ? m[1] : this.$route.path);
    }

}
//-----------------------------------------------------------------------------
</script>

<style scoped>
</style>