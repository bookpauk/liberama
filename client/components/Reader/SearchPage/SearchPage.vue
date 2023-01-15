<template>
    <Window ref="window" height="125px" max-width="600px" :top-shift="-50" @close="close">
        <template #header>
            {{ header }}
        </template>

        <div class="content">
            <span v-show="initStep">{{ initPercentage }}%</span>

            <div v-show="!initStep" class="input">
                <q-input
                    ref="input" v-model="needle"
                    class="col" outlined dense
                    bg-color="input"
                    placeholder="Найти"
                    @keydown="inputKeyDown"         
                />
                <div style="position: absolute; right: 10px; margin-top: 10px; font-size: 16px;">
                    {{ foundText }}
                </div>
            </div>
            <q-btn-group v-show="!initStep" class="button-group row no-wrap">
                <q-btn class="button" dense stretch @click="showNext">
                    <q-icon style="top: -2px" name="la la-angle-down" dense size="22px" />
                </q-btn>
                <q-btn class="button" dense stretch @click="showPrev">
                    <q-icon name="la la-angle-up" dense size="22px" />
                </q-btn>
            </q-btn-group>
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
    watch: {
        needle: function() {
            this.find();

        },
        foundText: function(newValue) {
            //недостатки сторонних ui
            const el = this.$refs.input.$el.querySelector('label div div div input');
            if (el)
                el.style.paddingRight = newValue.length*12 + 'px';
        },
    },
};
class SearchPage {
    _options = componentOptions;

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
        this.$refs.window.init();

        if (this.parsed != parsed) {
            this.initStep = true;
            this.stopInit = false;
            this.header = 'Подготовка';
            await this.$nextTick();
            await sleep(10);

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
            this.text = text.toLowerCase();
            this.initStep = false;
            this.needle = '';
            this.foundList = [];
            this.foundCur = -1;
            this.parsed = parsed;
        }

        this.header = 'Поиск в тексте';
        await this.$nextTick();
        this.focusInput();
        this.$refs.input.select();
    }

    focusInput() {
        if (!this.$root.isMobileDevice)
            this.$refs.input.focus();
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

        if (this.foundCur >= 0) {
            this.$emit('start-text-search', {needle: this.needle.toLowerCase()});
            this.$emit('book-pos-changed', {bookPos: this.foundList[this.foundCur]});
        } else {
            this.$emit('stop-text-search');
        }

        this.focusInput();
    }

    showPrev() {
        const prev = this.foundCur - 1;
        if (prev >= 0)
            this.foundCur = prev;
        else
            this.foundCur = this.foundList.length - 1;

        if (this.foundCur >= 0) {
            this.$emit('start-text-search', {needle: this.needle.toLowerCase()});
            this.$emit('book-pos-changed', {bookPos: this.foundList[this.foundCur]});
        } else {
            this.$emit('stop-text-search');
        }

        this.focusInput();
    }

    close() {
        this.stopInit = true;
        this.$emit('do-action', {action: 'search'});
    }

    inputKeyDown(event) {
        if (event.key == 'Enter') {
            this.showNext();
        }
    }

    keyHook(event) {
        if (event.type == 'keydown' && event.key == 'Escape') {
            this.close();
        }
        return true;
    }
}

export default vueComponent(SearchPage);
//-----------------------------------------------------------------------------
</script>

<style scoped>
.content {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 10px;
    min-width: 430px;
}

.input {
    display: flex;
    margin: 0;
    padding: 0;
    width: 100%;
    position: relative;
}

.button-group {
    width: 100px;
    margin: 0;
    padding: 0;
    height: 37px;
}

.button {
    padding: 9px 17px 9px 17px;
    width: 50px;
}
</style>