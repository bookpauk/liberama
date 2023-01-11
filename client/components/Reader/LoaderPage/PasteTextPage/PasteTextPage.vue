<template>
    <Window @close="close">
        <template #header>
            <span style="position: relative; top: -3px">
                Вставьте текст и нажмите
                <span class="clickable text-primary" style="font-size: 150%; position: relative; top: 1px" @click="loadBuffer">загрузить</span>
                или F2
            </span>
        </template>

        <div class="fit column main">
            <q-input v-model="bookTitle" class="q-px-sm" dense borderless placeholder="Введите название текста" />
            <hr />
            <textarea ref="textArea" class="main text" @paste="calcTitle"></textarea>
        </div>
    </Window>
</template>

<script>
//-----------------------------------------------------------------------------
import vueComponent from '../../../vueComponent.js';

import Window from '../../../share/Window.vue';
import _ from 'lodash';
import * as utils from '../../../../share/utils';

const componentOptions = {
    components: {
        Window,
    },
};
class PasteTextPage {
    _options = componentOptions;

    bookTitle = '';

    created() {
    }

    mounted() {
        this.$refs.textArea.focus();
    }

    get dark() {
        return this.$store.state.reader.settings.nightMode;
    }

    getNonEmptyLine3words(text, count) {
        let result = '';
        const lines = text.split("\n");
        let i = 0;
        while (i < lines.length) {
            if (lines[i].trim() != '') {
                count--;
                if (count <= 0) {
                    result = lines[i];
                    break;
                }
            }
            i++;
        }

        result = result.trim().split(' ');
        return result.slice(0, 3).join(' ');
    }

    calcTitle(event) {
        if (this.bookTitle == '') {
            this.bookTitle = `Из буфера обмена ${utils.dateFormat(new Date())}`;
            if (event) {
                let text = event.clipboardData.getData('text');
                this.bookTitle += ': ' + _.compact([
                    this.getNonEmptyLine3words(text, 1),
                    this.getNonEmptyLine3words(text, 2)
                ]).join(' - ');
            }
        }
    }

    loadBuffer() {
        this.calcTitle();
        this.$emit('load-buffer', {buffer: `<buffer><fb2-title>${utils.escapeXml(this.bookTitle)}</fb2-title>${utils.escapeXml(this.$refs.textArea.value)}</buffer>`});
        this.close();
    }

    close() {
        this.$emit('paste-text-toggle');
    }

    keyHook(event) {
        if (event.type == 'keydown') {
            switch (event.key) {
                case 'F2':
                    this.loadBuffer();
                    break;
                case 'Escape':
                    this.close();
                    break;
            }
        }
        return true;
    }
}

export default vueComponent(PasteTextPage);
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
    min-width: 400px;
}

.text:focus {
    outline: none;
}

.main {
    color: var(--text-app-color);
    background-color: var(--bg-app-color);
}

hr {
    margin: 0;
    padding: 0;
}

.clickable {
    color: blue;
    cursor: pointer;
}

</style>
