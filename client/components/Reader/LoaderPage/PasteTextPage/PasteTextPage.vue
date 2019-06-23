<template>
    <div ref="main" class="main" @click="close">
        <div class="mainWindow" @click.stop>
            <Window @close="close">
                <template slot="header">
                    Вставьте текст и нажмите
                    <el-button size="mini" style="font-size: 120%; color: blue" @click="loadBuffer">Загрузить</el-button>

                    или F2
                </template>

                <div>
                    <el-input placeholder="Введите название текста" class="input" v-model="bookTitle"></el-input>
                </div>
                <hr/>
                <textarea ref="textArea" class="text" @paste="calcTitle"></textarea>
            </Window>
        </div>
    </div>
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
        this.$emit('load-buffer', {buffer: `<cut-title>${this.bookTitle}</cut-title>${this.$refs.textArea.value}`});
        this.close();
    }

    close() {
        this.$emit('paste-text-toggle');
    }

    keyHook(event) {
        if (event.type == 'keydown') {
            switch (event.code) {
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
.main {
    position: absolute;
    width: 100%;
    height: 100%;
    z-index: 40;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}

.mainWindow {
    width: 100%;
    height: 100%;
    display: flex;
}

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

hr {
    margin: 0;
    padding: 0;
}
</style>
