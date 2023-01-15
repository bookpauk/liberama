<template>
    <div id="versionHistoryPage" class="page">
        <span class="text-h6 text-bold">История версий:</span>
        <br><br>

        <span v-for="(item, index) in versionHeader" :key="index" class="clickable" @click="showRelease(item)">
            <p>
                {{ item }}
            </p>
        </span>

        <br>

        <div v-for="item in versionContent" :id="item.key" :key="item.key">
            <span v-html="item.content"></span>
            <br>
        </div>
    </div>
</template>

<script>
//-----------------------------------------------------------------------------
import vueComponent from '../../../vueComponent.js';

import {versionHistory} from '../../versionHistory';

class VersionHistoryPage {
    versionHeader = [];
    versionContent = [];

    created() {
    }

    mounted() {
        let vh = [];
        for (const v of versionHistory) {
            vh.push(`${v.version} (${v.releaseDate})`);
        }
        this.versionHeader = vh;

        let vc = [];
        for (const v of versionHistory) {
            let header = `${v.version} (${v.releaseDate})`;
            vc.push({key: header, content: 'Версия ' + header + v.content});
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

export default vueComponent(VersionHistoryPage);
//-----------------------------------------------------------------------------
</script>

<style scoped>
.page {
    padding: 15px;
    overflow-y: auto;
    font-size: 120%;
    line-height: 130%;
    position: relative;
}

p {
    line-height: 15px;
}

.clickable {
    color: var(--text-anchor-color);
    text-decoration: underline;
    cursor: pointer;
}
</style>
