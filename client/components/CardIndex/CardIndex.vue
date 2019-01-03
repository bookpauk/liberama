<template>
    <el-container direction="vertical">
        <el-tabs type="border-card" style="height: 100%;" v-model="selectedTab">
            <el-tab-pane label="Поиск"></el-tab-pane>
            <el-tab-pane label="Автор"></el-tab-pane>
            <el-tab-pane label="Книга"></el-tab-pane>
            <el-tab-pane label="История"></el-tab-pane>
            <router-view></router-view>
        </el-tabs>
        {{ curRoute }}
    </el-container>
</template>

<script>
//-----------------------------------------------------------------------------
import Vue from 'vue';
import Component from 'vue-class-component';
import _ from 'lodash';

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
            const t = Number(newValue);
            if (tab2Route[t] !== this.curRoute) {
                this.$router.replace(tab2Route[t]);
            }
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
        if (lastActiveTab !== null)
            this.selectedTab = lastActiveTab;
    }

    setTabByRoute(route) {
        const t = _.indexOf(tab2Route, route);
        if (t >= 0 && t !== this.selectedTab) {
            this.selectedTab = t.toString();
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