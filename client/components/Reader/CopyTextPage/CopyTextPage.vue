<template>
    <Window @close="close">
        <template #header>
            Скопировать текст
        </template>

        <div ref="text" class="text" tabindex="-1">
            <div v-html="text"></div>
        </div>
    </Window>
</template>

<script>
//-----------------------------------------------------------------------------
import vueComponent from '../../vueComponent.js';

import Window from '../../share/Window.vue';
import {sleep} from '../../../share/utils';

const componentOptions = {
    components: {
        Window,
    },
};
class CopyTextPage {
    _options = componentOptions;

    text = null;
    initStep = null;
    initPercentage = 0;

    created() {
        this.commit = this.$store.commit;
        this.reader = this.$store.state.reader;
    }

    async init(bookPos, parsed, copyFullText) {
        this.text = 'Загрузка';
        await this.$nextTick();

        const paraIndex = parsed.findParaIndex(bookPos || 0);
        this.initStep = true;
        this.stopInit = false;

        let nextPerc = 0;
        let text = '';
        let cut = '';
        let from = 0;
        let to = parsed.para.length;
        if (!copyFullText) {
            from = paraIndex - 100;
            from = (from < 0 ? 0 : from);
            to = paraIndex + 100;
            to = (to > parsed.para.length ? parsed.para.length : to);
            cut = '<dd>..... Текст вырезан. Если хотите скопировать больше, поставьте в настройках галочку "Загружать весь текст"';
        }

        if (from > 0)
            text += cut;
        for (let i = from; i < to; i++) {
            const p = parsed.para[i];
            if (p.addIndex > 0)
                continue;

            const parts = parsed.splitToStyle(p.text);
            if (this.stopInit)
                return;

            text += `<dd id="p${i}" class="copyPara">&nbsp;&nbsp;`;
            for (const part of parts)
                text += part.text;

            const perc = Math.round(i/parsed.para.length*100);

            if (perc > nextPerc) {
                this.initPercentage = perc;
                await sleep(1);
                nextPerc = perc + 10;
            }
        }
        if (to < parsed.para.length)
            text += cut;

        this.text = text;
        this.initStep = false;

        await this.$nextTick();
        this.$refs.text.focus();

        const p = document.getElementById('p' + paraIndex);
        if (p) {
            this.$refs.text.scrollTop = p.offsetTop;
        }
    }

    close() {
        this.stopInit = true;
        this.$emit('do-action', {action: 'copyText'});
    }

    keyHook(event) {
        if (event.type == 'keydown' && event.key == 'Escape') {
            this.close();
        }
        return true;
    }
}

export default vueComponent(CopyTextPage);
//-----------------------------------------------------------------------------
</script>

<style scoped>
.text {
    flex: 1;
    overflow-wrap: anywhere;
    overflow-y: auto;
    padding: 0 10px 0 10px;
    position: relative;
    font-size: 120%;
}

.text:focus {
    outline: none;
}
</style>
<style>
.copyPara {
    margin: 0;
    padding: 0;
    text-indent: 30px;
}
</style>