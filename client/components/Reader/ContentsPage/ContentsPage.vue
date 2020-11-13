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
                    class="item"
                    expand-icon-toggle
                    switch-toggle-side
                    expand-icon="la la-arrow-circle-down"
                >
                    <template slot="header">
                        <div class="row no-wrap clickable" style="width: 470px">
                            <div class="q-mr-sm col overflow-hidden column justify-center" v-html="item.label"></div>
                            <div class="column justify-center">{{ item.perc }}%</div>
                        </div>
                    </template>

                    <q-item class="subitem clickable" v-for="subitem in item.list" :key="subitem.key">
                        <div class="row no-wrap" style="margin-left: 55px; padding-left: 60px; width: 470px">
                            <div class="q-mr-sm col overflow-hidden column justify-center"  v-html="subitem.label"></div>
                            <div class="column justify-center">{{ item.perc }}%</div>
                        </div>
                    </q-item>
                </q-expansion-item>
                <q-item v-else class="item clickable">
                    <div class="row no-wrap" style="margin-left: 55px; width: 470px">
                        <div class="q-mr-sm col overflow-hidden column justify-center" v-html="item.label"></div>
                        <div class="column justify-center">{{ item.perc }}%</div>
                    </div>
                </q-item>

                <q-separator />
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

        const prepareLabel = (title) => {
            let titleParts = title.split('<p>');
            const textParts = titleParts.filter(v => v).map(v => v.replace(/(&nbsp;|<([^>]+)>)/ig, ''));
            return textParts.join('<br>');
        }

        let i = 0;
        const newContents = [];
        parsed.contents.forEach((cont) => {
            const label = prepareLabel(cont.title);

            let j = 0;
            const list = [];
            cont.subtitles.forEach((sub) => {
                const l = prepareLabel(sub.title);
                const p = parsed.para[sub.paraIndex];
                list.push({perc: (p.offset/parsed.textLength*100).toFixed(2), label: l, key: j});
                j++;
            });

            const p = parsed.para[cont.paraIndex];
            newContents.push({perc: (p.offset/parsed.textLength*100).toFixed(0), label, key: i, list});

            i++;
        });

        this.contents = newContents;
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
</style>
