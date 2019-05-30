<template>
    <div id="versionHistoryPage" class="page">
        <span class="clickable" v-for="(item, index) in versionHeader" :key="index" @click="showRelease(item)">
            <p>
            {{ item }}
            </p>
        </span>

        <br>
        <h4>История версий:</h4>
        <br>

        <div v-for="item in versionContent" :id="item.key" :key="item.key">
            <span v-html="item.content"></span>
            <br>
        </div>
    </div>
</template>

<script>
//-----------------------------------------------------------------------------
import Vue from 'vue';
import Component from 'vue-class-component';
import {versionHistory} from '../../versionHistory';

export default @Component({
})
class VersionHistoryPage extends Vue {
    versionHeader = [];
    versionContent = [];

    created() {
    }

    mounted() {
        let vh = [];
        for (const version of versionHistory) {
            vh.push(version.header);
        }
        this.versionHeader = vh;

        let vc = [];
        for (const version of versionHistory) {
            vc.push({key: version.header, content: 'Версия ' + version.header + version.content});
        }
        this.versionContent = vc;
    }

    showRelease(id) {
        let el = document.getElementById(id);
        if (el) {
            document.getElementById('versionHistoryPage').scrollTop = el.offsetTop;
        }
    }
}
//-----------------------------------------------------------------------------
</script>

<style scoped>
.page {
    flex: 1;
    padding: 15px;
    overflow-y: auto;
    font-size: 120%;
    line-height: 130%;
}

h4 {
    margin: 0;
}

p {
    line-height: 15px;
}

.clickable {
    color: blue;
    text-decoration: underline;
    cursor: pointer;
}
</style>
