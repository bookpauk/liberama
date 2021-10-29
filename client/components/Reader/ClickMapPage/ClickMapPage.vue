<template>
    <div ref="page" class="map-page">
        <div class="content" v-html="mapHtml"></div>
    </div>
</template>

<script>
//-----------------------------------------------------------------------------
import vueComponent from '../../vueComponent.js';

import {sleep} from '../../../share/utils';
import {clickMap, clickMapText} from '../share/clickMap';

class ClickMapPage {
    fontSize = '200%';

    created() {
    }

    get mapHtml() {
        let result = '<div style="flex: 1; display: flex;">';

        let px = 0;
        for (const x in clickMap) {
            let div = `<div style="display: flex; flex-direction: column; width: ${x - px}%;">`;

            let py = 0;
            for (const y in clickMap[x]) {
                const text = clickMapText[clickMap[x][y]].split(' ');
                let divText = '';
                for (const t of text)
                    divText += `<span>${t}</span>`;
                div += `<div style="display: flex; flex-direction: column; justify-content: center; align-items: center; ` +
                    `height: ${y - py}%; border: 1px solid white; font-size: ${this.fontSize}; line-height: 100%;">${divText}</div>`;
                py = y;
            }

            div += '</div>';
            px = x;
            result += div;
        }

        result += '</div>';
        return result;
    }

    async slowDisappear() {
        const page = this.$refs.page;
        page.style.animation = 'click-map-disappear 5s ease-in 1';
        await sleep(5000);
    }
}

export default vueComponent(ClickMapPage);
//-----------------------------------------------------------------------------
</script>

<style scoped>
.map-page {
    position: absolute;
    width: 100%;
    height: 100%;
    z-index: 19;
    background-color: rgba(0, 0, 0, 0.9);
    color: white;
    display: flex;
}

.content {
    flex: 1;
    display: flex;
}
</style>
<style>
@keyframes click-map-disappear {
    0%   { opacity: 0.9; }
    100% { opacity: 0; }
}
</style>
