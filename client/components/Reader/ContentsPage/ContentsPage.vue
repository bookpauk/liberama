<template>
    <Window ref="window" width="600px" @close="close">
        <template #header>
            Оглавление/закладки
        </template>

        <div class="bg-menu-1 row">
            <q-tabs
                v-model="selectedTab"
                active-color="app"
                active-bg-color="app"
                indicator-color="bg-app"
                dense
                no-caps
                inline-label
                class="no-mp bg-menu-2 text-menu"
            >
                <q-tab name="contents" icon="la la-list" label="Оглавление" />
                <q-tab name="images" icon="la la-image" label="Изображения" />
                <!--q-tab name="bookmarks" icon="la la-bookmark" label="Закладки" /-->
            </q-tabs>
        </div>

        <div class="q-mb-sm" />

        <div v-show="selectedTab == 'contents'" ref="tabPanelContents" class="tab-panel">
            <div>
                <div v-for="item in contents" :key="item.key" class="column" style="width: 540px">
                    <div :ref="`mainitem${item.key}`" class="row q-px-sm no-wrap" :class="{'item': !item.isBookPos, 'item-book-pos': item.isBookPos}">
                        <div v-if="item.list.length" class="row justify-center items-center expand-button clickable" @click="expandClick(item.key)">
                            <q-icon name="la la-caret-right" class="icon" :class="{'expanded-icon': item.expanded}" color="green-8" size="24px" />
                        </div>
                        <div v-else class="no-expand-button clickable" @click="setBookPos(item.offset)">
                            <q-icon name="la la-stop" class="icon" style="visibility: hidden" size="24px" />
                        </div>
                        <div class="col row clickable" @click="setBookPos(item.offset)">
                            <div :style="item.indentStyle"></div>
                            <div class="q-mr-sm col overflow-hidden column justify-center" :style="item.labelStyle" v-html="item.label"></div>
                            <div class="column justify-center">
                                {{ item.perc }}%
                            </div>
                        </div>
                    </div>
                    
                    <div v-if="item.expanded" :ref="`subdiv${item.key}`" class="subitems-transition">
                        <div 
                            v-for="subitem in item.list" 
                            :ref="`subitem${subitem.key}`" 
                            :key="subitem.key" class="row q-px-sm no-wrap" :class="{'subitem': !subitem.isBookPos, 'subitem-book-pos': subitem.isBookPos}"
                        >
                            <div class="col row clickable" @click="setBookPos(subitem.offset)">
                                <div class="no-expand-button"></div>
                                <div :style="subitem.indentStyle"></div>
                                <div class="q-mr-sm col overflow-hidden column justify-center" :style="item.labelStyle" v-html="subitem.label"></div>
                                <div class="column justify-center">
                                    {{ subitem.perc }}%
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div v-if="!contents.length" class="column justify-center items-center" style="height: 100px">
                    Оглавление отсутствует
                </div>
            </div>
        </div>

        <div v-show="selectedTab == 'images'" ref="tabPanelImages" class="tab-panel">
            <div>
                <div v-for="item in images" :key="item.key" class="column" style="width: 540px">
                    <div :ref="`image${item.key}`" class="row q-px-sm no-wrap" :class="{'item': !item.isBookPos, 'item-book-pos': item.isBookPos}">
                        <div class="col row clickable" @click="setBookPos(item.offset)">
                            <div class="image-thumb-box row justify-center items-center">
                                <div v-show="!imageLoaded[item.id]" class="image-thumb column justify-center">
                                    <i class="loading-img-icon la la-images"></i>
                                </div>
                                <img v-show="imageLoaded[item.id]" class="image-thumb" :src="imageSrc[item.id]" />
                            </div>
                            <div class="no-expand-button column justify-center items-center">
                                <div class="image-num">
                                    {{ item.num }}
                                </div>
                                <div v-show="item.type == 'image/jpeg'" class="image-type text-black it-jpg-color row justify-center">
                                    JPG
                                </div>
                                <div v-show="item.type == 'image/png'" class="image-type text-black it-png-color row justify-center">
                                    PNG
                                </div>
                                <div v-show="!item.local" class="image-type text-black it-net-color row justify-center">
                                    INET
                                </div>
                            </div>
                            <div :style="item.indentStyle"></div>
                            <div class="q-mr-sm col overflow-hidden column justify-center" :style="item.labelStyle" v-html="item.label"></div>
                            <div class="column justify-center">
                                {{ item.perc }}%
                            </div>
                        </div>
                    </div>
                </div>
                <div v-if="!images.length" class="column justify-center items-center" style="height: 100px">
                    Изображения отсутствуют
                </div>
            </div>
        </div>

        <div v-show="selectedTab == 'bookmarks'" class="tab-panel">
            <div class="column justify-center items-center" style="height: 100px">
                Раздел находится в разработке
            </div>
        </div>
    </Window>
</template>

<script>
//-----------------------------------------------------------------------------
import vueComponent from '../../vueComponent.js';

//import _ from 'lodash';

import Window from '../../share/Window.vue';
import * as utils from '../../../share/utils';

const componentOptions = {
    components: {
        Window,
    },
    watch: {
        bookPos() {
            this.updateBookPosSelection();
        },
        selectedTab() {
            this.updateBookPosScrollTop();
        },
    },
};
class ContentsPage {
    _options = componentOptions;
    _props = {
        bookPos: Number,
        isVisible: Boolean,
    };

    selectedTab = 'contents';
    contents = [];
    images = [];
    imageSrc = [];
    imageLoaded = [];

    created() {
    }

    async init(currentBook, parsed) {
        this.$refs.window.init();

        //закладки

        //проверим, надо ли обновлять списки
        if (this.parsed == parsed) {
            this.updateBookPosSelection();
            return;
        }

        //далее формирование оглавления
        this.parsed = parsed;
        this.contents = [];
        await this.$nextTick();

        const pc = parsed.contents;
        const ims = parsed.images;
        const newpc = [];        
        if (pc.length) {//если есть оглавление
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
        } else {//попробуем вытащить из images
            for (let i = 0; i < ims.length; i++) {
                const image = ims[i];

                if (image.alt) {
                    newpc.push({paraIndex: image.paraIndex, title: image.alt, inset: 1, bodyIndex: 0, subtitles: []});
                }
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
        for (i = 0; i < ims.length; i++) {
            const image = ims[i];
            const bin = parsed.binary[image.id];
            const type = (bin ? bin.type : '');
            
            const label = (image.alt ? image.alt : '<span style="font-size: 90%; color: var(--bg-menu-color2)"><i>Без названия</i></span>');
            const indentStyle = getIndentStyle(1);
            const labelStyle = getLabelStyle(1);

            const p = parsed.para[image.paraIndex];
            newImages.push({perc: (p.offset/parsed.textLength*100).toFixed(0), label, key: i, offset: p.offset,
                indentStyle, labelStyle, type, num: image.num, id: image.id, local: image.local});
        }

        this.images = newImages;

        if (this.selectedTab == 'contents' && !this.contents.length && this.images.length)
            this.selectedTab = 'images';

        //выделим на bookPos
        this.updateBookPosSelection();

        //асинхронная загрузка изображений
        this.imageSrc = [];
        this.imageLoaded = [];
        await utils.sleep(50);
        (async() => {
            for (i = 0; i < ims.length; i++) {
                const {id, local} = ims[i];
                const bin = this.parsed.binary[id];
                if (local)
                    this.imageSrc[id] = (bin ? `data:${bin.type};base64,${bin.data}` : '');
                else
                    this.imageSrc[id] = id;
                this.imageLoaded[id] = true;
                await utils.sleep(5);
            }
        })();
    }

    async updateBookPosSelection() {
        if (!this.isVisible)
            return;

        await this.$nextTick();
        const bp = this.bookPos;
        
        for (let i = 0; i < this.contents.length; i++) {
            const item = this.contents[i];
            const nextOffset = (i < this.contents.length - 1 ? this.contents[i + 1].offset : this.parsed.textLength);

            if (bp >= item.offset && bp < nextOffset) {
                item.isBookPos = true;
            } else if (item.isBookPos) {
                item.isBookPos = false;
            }

            for (let j = 0; j < item.list.length; j++) {
                const subitem = item.list[j];
                const nextSubOffset = (j < item.list.length - 1 ? item.list[j + 1].offset : nextOffset);

                if (bp >= subitem.offset && bp < nextSubOffset) {
                    subitem.isBookPos = true;
                    this.updateBookPosScrollTop('contents', item, subitem, j);
                } else if (subitem.isBookPos) {
                    subitem.isBookPos = false;
                }
            }
        }

        for (let i = 0; i < this.images.length; i++) {
            const img = this.images[i];
            const nextOffset = (i < this.images.length - 1 ? this.images[i + 1].offset : this.parsed.textLength);

            if (bp >= img.offset && bp < nextOffset) {
                this.images[i].isBookPos = true;
            } else if (img.isBookPos) {
                this.images[i].isBookPos = false;
            }
        }

        this.updateBookPosScrollTop();
    }

    /*getOffsetTop(key) {
        let el = this.getFirstElem(this.$refs[`mainitem${key}`]);
        return (el ? el.offsetTop : 0);
    }*/

    async updateBookPosScrollTop() {
        try {
            await this.$nextTick();

            if (this.selectedTab == 'contents') {
                let item;
                let subitem;
                let i;

                //ищем выделенные item
                for(const _item of this.contents) {
                    if (_item.isBookPos) {
                        item = _item;
                        for (let ii = 0; ii < item.list.length; ii++) {
                            const _subitem = item.list[ii];
                            if (_subitem.isBookPos) {
                                subitem = _subitem;
                                i = ii;
                                break;
                            }
                        }
                        break;
                    }
                }

                if (!item)
                    return;

                //вычисляем и смещаем tabPanel.scrollTop
                let el = this.getFirstElem(this.$refs[`mainitem${item.key}`]);
                let elShift = 0;
                if (subitem && item.expanded) {
                    const subEl = this.getFirstElem(this.$refs[`subitem${subitem.key}`]);
                    elShift = el.offsetHeight - subEl.offsetHeight*(i + 1);
                } else {
                    elShift = el.offsetHeight;
                }

                const tabPanel = this.$refs.tabPanelContents;
                const halfH = tabPanel.clientHeight/2;
                const newScrollTop = el.offsetTop - halfH - elShift;
                if (newScrollTop < 20 + tabPanel.scrollTop - halfH || newScrollTop > -20 + tabPanel.scrollTop + halfH) 
                    tabPanel.scrollTop = newScrollTop;
            }

            if (this.selectedTab == 'images') {
                let item;

                //ищем выделенные item
                for(const _item of this.images) {
                    if (_item.isBookPos) {
                        item = _item;
                        break;
                    }
                }

                if (!item)
                    return;

                //вычисляем и смещаем tabPanel.scrollTop
                let el = this.getFirstElem(this.$refs[`image${item.key}`]);

                const tabPanel = this.$refs.tabPanelImages;
                const halfH = tabPanel.clientHeight/2;
                const newScrollTop = el.offsetTop - halfH - el.offsetHeight/2;

                if (newScrollTop < 20 + tabPanel.scrollTop - halfH || newScrollTop > -20 + tabPanel.scrollTop + halfH) 
                    tabPanel.scrollTop = newScrollTop;
            }
        } catch (e) {
            console.error(e);
        }
    }

    getFirstElem(items) {
        return (Array.isArray(items) ? items[0] : items);
    }

    async expandClick(key) {
        const item = this.contents[key];
        const expanded = !item.expanded;

        if (!expanded) {
            let subdiv = this.getFirstElem(this.$refs[`subdiv${key}`]);
            subdiv.style.height = '0';
            await utils.sleep(200);
        }

        this.contents[key].expanded = expanded;

        if (expanded) {
            await this.$nextTick();
            let subdiv = this.getFirstElem(this.$refs[`subdiv${key}`]);
            subdiv.style.height = subdiv.scrollHeight + 'px';
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

export default vueComponent(ContentsPage);
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

.item, .subitem, .item-book-pos, .subitem-book-pos {
    border-bottom: 1px solid var(--bg-menu-color2);
}

.item:hover, .subitem:hover {
    background-color: var(--bg-menu-color2);
}

.item-book-pos {
    opacity: 1;
    background-color: var(--bg-selected-item-color1);
}

.subitem-book-pos {
    opacity: 1;
    background-color: var(--bg-selected-item-color2);
}

.item-book-pos:hover {
    opacity: 0.8;
    transition: opacity 0.2s linear;
}

.subitem-book-pos:hover {
    opacity: 0.8;
    transition: opacity 0.2s linear;
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

.image-num {
    font-size: 120%;
    padding-bottom: 3px;
}
.image-type {
    border: 1px solid black;
    border-radius: 6px;
    font-size: 80%;
    padding: 2px 0 2px 0;
    width: 34px;
}
.it-jpg-color {
    background: linear-gradient(to right, #fabc3d, #ffec6d);
}
.it-png-color {
    background: linear-gradient(to right, #4bc4e5, #6bf4ff);
}
.it-net-color {
    background: linear-gradient(to right, #00c400, #00f400);
}

.image-thumb-box {
    width: 120px;
    overflow: hidden;
}

.image-thumb {
    height: 50px;
    background-color: white;
}

.loading-img-icon {
    font-size: 250%;
}
</style>
