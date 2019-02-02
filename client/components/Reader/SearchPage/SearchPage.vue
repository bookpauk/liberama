<template>
    <div ref="main" class="main" @click="close">
        <div class="mainWindow" @click.stop>
            <Window @close="close">
                <template slot="header">
                    {{ header }}
                </template>

                <div class="content">
                    <span v-show="initStep">{{ initPercentage }}%</span>

                    <div v-show="!initStep" class="input">
                        <input ref="input" class="el-input__inner"
                            placeholder="что ищем"
                            :value="needle" @input="needle = $event.target.value"/>
                        <div style="position: absolute; right: 10px; margin-top: 10px; font-size: 16px;">{{ foundText }}</div>
                    </div>
                    <el-button-group v-show="!initStep" class="button-group">
                        <el-button @click="showNext"><i class="el-icon-arrow-down"></i></el-button>
                        <el-button @click="showPrev"><i class="el-icon-arrow-up"></i></el-button>
                    </el-button-group>
                </div>
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
    watch: {
        needle: function() {
            this.find();

        },
        foundText: function(newValue) {
            this.$refs.input.style.paddingRight = (10 + newValue.length*12) + 'px';
        },
    },
})
class SearchPage extends Vue {
    header = null;
    initStep = null;
    initPercentage = 0;
    needle = null;
    foundList = [];
    foundCur = -1;

    created() {
        this.commit = this.$store.commit;
        this.reader = this.$store.state.reader;
    }

    async init(parsed) {
        if (this.parsed != parsed) {
            this.initStep = true;
            this.stopInit = false;
            this.header = 'Подготовка';
            await this.$nextTick();

            let prevPerc = 0;
            let text = '';
            for (let i = 0; i < parsed.para.length; i++) {
                const p = parsed.para[i];
                const parts = parsed.splitToStyle(p.text);
                if (this.stopInit)
                    break;

                for (const part of parts)
                    text += part.text;

                const perc = Math.round(i/parsed.para.length*100);

                if (perc != prevPerc) {
                    this.initPercentage = perc;
                    await sleep(1);
                    prevPerc = perc;
                }
            }
            this.text = text.toLowerCase();
            this.initStep = false;
            this.needle = '';
            this.foundList = [];
            this.foundCur = -1;
            this.parsed = parsed;
        }

        this.header = 'Найти';
        await this.$nextTick();
        this.$refs.input.focus();
        this.$refs.input.select();
    }

    get foundText() {
        if (this.foundList.length && this.foundCur >= 0)
            return `${this.foundCur + 1}/${this.foundList.length}`;
        else
            return '';
    }

    find() {
        let foundList = [];
        if (this.needle) {
            const needle = this.needle.toLowerCase();
            let i = 0;
            while (i < this.text.length) {
                const found = this.text.indexOf(needle, i);
                if (found >= 0)
                    foundList.push(found);
                i = (found >= 0 ? found + 1 : this.text.length);
            }
        }
        this.foundList = foundList;
        this.foundCur = -1;
        this.showNext();
    }

    showNext() {
        const next = this.foundCur + 1;
        if (next < this.foundList.length)
            this.foundCur = next;
        else
            this.foundCur = (this.foundList.length ? 0 : -1);
        this.$emit('book-pos-changed', {bookPos: this.foundList[this.foundCur]});
        this.$refs.input.focus();
    }

    showPrev() {
        const prev = this.foundCur - 1;
        if (prev >= 0)
            this.foundCur = prev;
        else
            this.foundCur = this.foundList.length - 1;
        this.$emit('book-pos-changed', {bookPos: this.foundList[this.foundCur]});
        this.$refs.input.focus();
    }

    close() {
        this.stopInit = true;
        this.$emit('search-toggle');
    }

    keyHook(event) {
        //недостатки сторонних ui
        if (document.activeElement === this.$refs.input && event.type == 'keydown' && event.key == 'Enter') {
            this.showNext();
        }

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