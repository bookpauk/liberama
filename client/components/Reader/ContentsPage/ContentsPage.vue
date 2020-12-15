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
            <q-tab name="images" icon="la la-image" label="Изображения" />
            <q-tab name="bookmarks"  icon="la la-bookmark" label="Закладки" />
        </q-tabs>
    </div>

    <div class="q-mb-sm"/>

    <div class="tab-panel" v-show="selectedTab == 'contents'">
        <div>
            <div v-for="item in contents" :key="item.key" class="column" style="width: 540px">
                <div class="row item q-px-sm no-wrap">
                    <div v-if="item.list.length" class="row justify-center items-center expand-button clickable" @click="expandClick(item.key)">
                        <q-icon name="la la-caret-right" class="icon" :class="{'expanded-icon': item.expanded}" color="green-8" size="20px"/>
                    </div>
                    <div v-else class="no-expand-button clickable" @click="setBookPos(item.offset)">
                        <q-icon name="la la-stop" class="icon" style="visibility: hidden" size="20px"/>
                    </div>
                    <div class="col row clickable" @click="setBookPos(item.offset)">
                        <div :style="item.indentStyle"></div>
                        <div class="q-mr-sm col overflow-hidden column justify-center" :style="item.labelStyle" v-html="item.label"></div>
                        <div class="column justify-center">{{ item.perc }}%</div>
                    </div>
                </div>
                
                <div v-if="item.expanded" :ref="`subitem${item.key}`" class="subitems-transition">
                    <div v-for="subitem in item.list" :key="subitem.key" class="row subitem q-px-sm no-wrap">
                        <div class="col row clickable" @click="setBookPos(subitem.offset)">
                            <div class="no-expand-button"></div>
                            <div :style="subitem.indentStyle"></div>
                            <div class="q-mr-sm col overflow-hidden column justify-center" :style="item.labelStyle" v-html="subitem.label"></div>
                            <div class="column justify-center">{{ subitem.perc }}%</div>
                        </div>
                    </div>
                </div>
            </div>
            <div v-if="!contents.length" class="column justify-center items-center" style="height: 100px">
                Оглавление отсутствует
            </div>
        </div>
    </div>

    <div class="tab-panel" v-show="selectedTab == 'images'">
        <div>
            <div v-for="item in images" :key="item.key" class="column" style="width: 540px">
                <div class="row item q-px-sm no-wrap">
                    <div class="col row clickable" @click="setBookPos(item.offset)">
                        <div class="no-expand-button"></div>
                        <div :style="item.indentStyle"></div>
                        <div class="q-mr-sm col overflow-hidden column justify-center" :style="item.labelStyle" v-html="item.label"></div>
                        <div class="column justify-center">{{ item.perc }}%</div>
                    </div>
                </div>
            </div>
            <div v-if="!images.length" class="column justify-center items-center" style="height: 100px">
                Изображения отсутствуют
            </div>
        </div>
    </div>

    <div class="tab-panel" v-show="selectedTab == 'bookmarks'">
        <div class="column justify-center items-center" style="height: 100px">
            Раздел находится в разработке
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
import * as utils from '../../../share/utils';

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
    images = [];

    created() {
    }

    async init(currentBook, parsed) {
        this.$refs.window.init();

        //закладки

        //далее формаирование оглавления
        if (this.parsed == parsed)
            return;

        this.parsed = parsed;
        this.contents = [];
        await this.$nextTick();

        const pc = parsed.contents;
        const newpc = [];
        //преобразуем все, кроме первого, разделы body в title-subtitle
        let curSubtitles = [];
        let prevBodyIndex = -1;
        for (let i = 0; i < pc.length; i++) {
            const cont = pc[i];
            if (prevBodyIndex != cont.bodyIndex)
                curSubtitles = [];

            prevBodyIndex = cont.bodyIndex;

            if (cont.bodyIndex > 1) {
                if (cont.inset < 1) {
                    newpc.push(Object.assign({}, cont, {subtitles: curSubtitles}));
                } else {
                    curSubtitles.push(Object.assign({}, cont, {inset: cont.inset - 1}));
                }
            } else {
                newpc.push(cont);
            }
        }

        const prepareLabel = (title, bolder = false) => {
            let titleParts = title.split('<p>');
            const textParts = titleParts.filter(v => v).map(v => `<div>${utils.removeHtmlTags(v)}</div>`);
            if (bolder && textParts.length > 1)
                textParts[0] = `<b>${textParts[0]}</b>`;
            return textParts.join('');
        }

        const getIndentStyle = inset => `width: ${inset*20}px`;

        const getLabelStyle = (inset) => {
            const fontSizes = ['110%', '100%', '90%', '85%'];
            inset = (inset > 3 ? 3 : inset);
            return `font-size: ${fontSizes[inset]}`;
        };

        //формируем newContents
        let i = 0;
        const newContents = [];
        newpc.forEach((cont) => {
            const label = prepareLabel(cont.title, true);
            const indentStyle = getIndentStyle(cont.inset);
            const labelStyle = getLabelStyle(cont.inset);

            let j = 0;
            const list = [];
            cont.subtitles.forEach((sub) => {
                const l = prepareLabel(sub.title);
                const s = getIndentStyle(sub.inset + 1);
                const ls = getLabelStyle(cont.inset + 1);
                const p = parsed.para[sub.paraIndex];
                list[j] = {perc: (p.offset/parsed.textLength*100).toFixed(2), label: l, key: j, offset: p.offset, indentStyle: s, labelStyle: ls};
                j++;
            });

            const p = parsed.para[cont.paraIndex];
            newContents[i] = {perc: (p.offset/parsed.textLength*100).toFixed(0), label, key: i, offset: p.offset, indentStyle, labelStyle, expanded: false, list};

            i++;
        });

        this.contents = newContents;

        //формируем newImages
        const newImages = [];
        const ims = parsed.images;
        for (i = 0; i < ims.length; i++) {
            const image = ims[i];

            const label = `Изображение ${image.num}`;
            const indentStyle = getIndentStyle(0);
            const labelStyle = getLabelStyle(0);

            const p = parsed.para[image.paraIndex];
            newImages.push({perc: (p.offset/parsed.textLength*100).toFixed(0), label, key: i, offset: p.offset, indentStyle, labelStyle});
        }

        this.images = newImages;
    }

    async expandClick(key) {
        const item = this.contents[key];
        const expanded = !item.expanded;

        if (!expanded) {
            const subitems = this.$refs[`subitem${key}`][0];
            subitems.style.height = '0';
            await utils.sleep(200);
        }

        this.$set(this.contents, key, Object.assign({}, item, {expanded}));

        if (expanded) {
            await this.$nextTick();
            const subitems = this.$refs[`subitem${key}`][0];
            subitems.style.height = subitems.scrollHeight + 'px';
        }
    }

    async setBookPos(newValue) {
        this.$emit('book-pos-changed', {bookPos: newValue});
        this.close();
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
    padding: 10px 0 10px 0;
}

.item, .subitem {
    border-bottom: 1px solid #e0e0e0;
}

.item:hover, .subitem:hover {
    background-color: #f0f0f0;
}

.expand-button, .no-expand-button {
    width: 40px;
}

.subitems-transition {
    height: 0;
    transition: height 0.2s linear;
    overflow: hidden;
}

.icon {
    transition: transform 0.2s;
}

.expanded-icon {
    transform: rotate(90deg);
}
</style>
