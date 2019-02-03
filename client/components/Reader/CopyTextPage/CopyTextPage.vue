<template>
    <div ref="main" class="main" @click="close">
        <div class="mainWindow" @click.stop>
            <Window @close="close">
                <template slot="header">
                    Скопировать текст
                </template>

            </Window>
        </div>
    </div>
</template>

<script>
//-----------------------------------------------------------------------------
import Vue from 'vue';
import Component from 'vue-class-component';

import Window from '../../share/Window.vue';
import {sleep} from '../../../share/utils';

export default @Component({
    components: {
        Window,
    },
})
class CopyTextPage extends Vue {
    initStep = null;
    initPercentage = 0;

    created() {
        this.commit = this.$store.commit;
        this.reader = this.$store.state.reader;
    }

    async init(bookPos, parsed) {
        if (this.parsed != parsed) {
            this.initStep = true;
            this.stopInit = false;

            let nextPerc = 0;
            let text = '';
            for (let i = 0; i < parsed.para.length; i++) {
                const p = parsed.para[i];
                const parts = parsed.splitToStyle(p.text);
                if (this.stopInit)
                    return;

                for (const part of parts)
                    text += part.text;

                const perc = Math.round(i/parsed.para.length*100);

                if (perc > nextPerc) {
                    this.initPercentage = perc;
                    await sleep(1);
                    nextPerc = perc + 10;
                }
            }            

            this.initStep = false;
            this.parsed = parsed;
        }
    }

    close() {
        this.stopInit = true;
        this.$emit('copy-text-toggle');
    }

    keyHook(event) {
        if (event.type == 'keydown' && (event.code == 'Escape')) {
            this.close();
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
    max-width: 500px;
    height: 125px;
    display: flex;
    position: relative;
    top: -50px;
}

.content {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 10px;
}

.input {
    display: flex;
    margin: 0;
    padding: 0;
    width: 100%;
    position: relative;
}

.button-group {
    width: 150px;
    margin: 0;
    padding: 0;
}

.el-button {
    padding: 9px 17px 9px 17px;
}

i {
    font-size: 20px;
}
</style>