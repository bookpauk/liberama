<template>
    <Window width="600px" ref="window" @close="close">
        <template slot="header">
            Оглавление/закладки
        </template>

    <div class="bg-grey-3 row">
        <q-tabs
            v-model="selectedTab"
            active-color="black"
            active-bg-color="white"
            indicator-color="white"
            dense
            no-caps
            inline-label
            class="no-mp bg-grey-4 text-grey-7"
        >
            <q-tab name="contents" icon="la la-list" label="Оглавление" />
            <q-tab name="bookmarks"  icon="la la-bookmark" label="Закладки" />
        </q-tabs>
    </div>

    <div class="q-mb-sm"/>

    <div class="tab-panel" v-show="selectedTab == 'contents'">
        <div>
            <div class="row" v-for="item in contents" :key="item.key">                
                <q-expansion-item v-if="item.list.length"
                    class="item separator-bottom"
                    expand-icon-toggle
                    switch-toggle-side
                    expand-icon="la la-arrow-circle-down"
                >
                    <template slot="header">
                        <div class="row no-wrap clickable" style="width: 465px" @click="setBookPos(item.offset)">
                            <div :style="item.style"></div>
                            <div class="q-mr-sm col overflow-hidden column justify-center" v-html="item.label"></div>
                            <div class="column justify-center">{{ item.perc }}%</div>
                        </div>
                    </template>

                    <q-item class="subitem separator-top column justify-center" v-for="subitem in item.list" :key="subitem.key">
                        <div class="row no-wrap clickable" style="padding-left: 55px; width: 520px" @click="setBookPos(subitem.offset)">
                            <div :style="subitem.style"></div>
                            <div class="q-mr-sm col overflow-hidden column justify-center"  v-html="subitem.label"></div>
                            <div class="column justify-center">{{ subitem.perc }}%</div>
                        </div>
                    </q-item>
                </q-expansion-item>
                <q-item v-else class="item separator-bottom">
                    <div class="row no-wrap clickable" style="padding-left: 55px; width: 520px" @click="setBookPos(item.offset)">
                        <div :style="item.style"></div>
                        <div class="q-mr-sm col overflow-hidden column justify-center" v-html="item.label"></div>
                        <div class="column justify-center">{{ item.perc }}%</div>
                    </div>
                </q-item>
            </div>
        </div>
    </div>

    <div class="tab-panel" v-show="selectedTab == 'bookmarks'">
        <div>
        </div>
    </div>

    </Window>
</template>

<script>
//-----------------------------------------------------------------------------
import Vue from 'vue';
import Component from 'vue-class-component';
//import _ from 'lodash';

import Window from '../../share/Window.vue';
//import * as utils from '../../../share/utils';

export default @Component({
    components: {
        Window,
    },
    watch: {
    },
})
class ContentsPage extends Vue {
    selectedTab = 'contents';
    contents = [];

    created() {
    }

    init(currentBook, parsed) {
        this.$refs.window.init();

        const prepareLabel = (title, bolder = false) => {
            let titleParts = title.split('<p>');
            const textParts = titleParts.filter(v => v).map(v => `<div>${v.replace(/(<([^>]+)>)/ig, '')}</div>`);
            if (bolder && textParts.length > 1)
                textParts[0] = `<b>${textParts[0]}</b>`;
            return textParts.join('');
        }

        const insetStyle = inset => `width: ${(inset > 1 ? inset - 1 : 0)*20}px`;

        let i = 0;
        const newContents = [];
        parsed.contents.forEach((cont) => {
            const label = prepareLabel(cont.title, true);
            const style = insetStyle(cont.inset);

            let j = 0;
            const list = [];
            cont.subtitles.forEach((sub) => {
                const l = prepareLabel(sub.title);
                const s = insetStyle(sub.inset + 1);
                const p = parsed.para[sub.paraIndex];
                list.push({perc: (p.offset/parsed.textLength*100).toFixed(2), label: l, key: j, offset: p.offset, style: s});
                j++;
            });

            const p = parsed.para[cont.paraIndex];
            newContents.push({perc: (p.offset/parsed.textLength*100).toFixed(0), label, key: i, offset: p.offset, style, list});

            i++;
        });

        this.contents = newContents;
    }

    setBookPos(newValue) {
        this.$emit('book-pos-changed', {bookPos: newValue});
    }

    close() {
        this.$emit('do-action', {action: 'contents'});
    }

    keyHook(event) {
        if (!this.$root.stdDialog.active && event.type == 'keydown' && event.key == 'Escape') {
            this.close();
        }
        return true;
    }
}
//-----------------------------------------------------------------------------
</script>

<style scoped>
.tab-panel {
    overflow-x: hidden;
    overflow-y: auto;
    font-size: 90%;
    padding: 0 10px 0px 10px;
}

.clickable {
    cursor: pointer;
}

.item:hover {
    background-color: #f0f0f0;
}

.subitem:hover {
    background-color: #e0e0e0;
}

.separator-top {
    border-top: 1px solid #e0e0e0;
}
.separator-bottom {
    border-top: 1px solid #e0e0e0;
}
</style>
