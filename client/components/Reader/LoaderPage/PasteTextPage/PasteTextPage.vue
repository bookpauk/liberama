<template>
    <Window @close="close">
        <template slot="header">
            <span style="position: relative; top: -3px">
                Вставьте текст и нажмите
                <span class="clickable text-primary" style="font-size: 150%; position: relative; top: 1px" @click="loadBuffer">загрузить</span>
                или F2
            </span>
        </template>

        <q-input class="q-px-sm" dense borderless v-model="bookTitle" placeholder="Введите название текста"/>
        <hr/>
        <textarea ref="textArea" class="text" @paste="calcTitle"></textarea>
    </Window>
</template>

<script>
//-----------------------------------------------------------------------------
import Vue from 'vue';
import Component from 'vue-class-component';

import Window from '../../../share/Window.vue';
import _ from 'lodash';
import * as utils from '../../../../share/utils';

export default @Component({
    components: {
        Window,
    },
})
class PasteTextPage extends Vue {
    bookTitle = '';

    created() {
    }

    mounted() {
        this.$refs.textArea.focus();
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
            let text = event.clipboardData.getData('text');
            this.bookTitle = `Из буфера обмена ${utils.formatDate(new Date(), 'noDate')}: ` + _.compact([
                this.getNonEmptyLine3words(text, 1),
                this.getNonEmptyLine3words(text, 2)
            ]).join(' - ');
        }
    }

    loadBuffer() {
        this.$emit('load-buffer', {buffer: `<buffer><cut-title>${utils.escapeXml(this.bookTitle)}</cut-title>${this.$refs.textArea.value}</buffer>`});
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

hr {
    margin: 0;
    padding: 0;
}

.clickable {
    color: blue;
    cursor: pointer;
}

</style>
