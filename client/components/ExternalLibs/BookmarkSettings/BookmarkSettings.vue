<template>
    <Window ref="window" width="600px" height="95%" @close="close">
        <template #header>
            Настроить закладки
        </template>

        <div class="col column fit">
            <div class="row items-center top-panel bg-grey-3">
                <q-btn :disabled="!selected" class="q-mr-md" round dense color="blue" icon="la la-check" size="16px" @click.stop="openSelected">
                    <q-tooltip :delay="1500" anchor="bottom middle" content-style="font-size: 80%">
                        Открыть выбранную закладку
                    </q-tooltip>
                </q-btn>
                <q-input ref="search" v-model="search" class="col" outlined dense bg-color="white" placeholder="Найти">
                    <template #append>
                        <q-icon v-if="search !== ''" name="la la-times" class="cursor-pointer" @click="resetSearch" />
                    </template>
                </q-input>
            </div>

            <div class="col row">
                <div class="left-panel column items-center no-wrap bg-grey-3">
                    <q-btn class="q-my-sm" round dense color="blue" icon="la la-plus" size="14px" @click.stop="addBookmark">
                        <q-tooltip :delay="1500" anchor="bottom middle" content-style="font-size: 80%">
                            Добавить закладку
                        </q-tooltip>
                    </q-btn>
                    <q-btn :disabled="!ticked.length" class="q-mb-sm" round dense color="blue" icon="la la-minus" size="14px" @click.stop="delBookmark">
                        <q-tooltip :delay="1500" anchor="bottom middle" content-style="font-size: 80%">
                            Удалить отмеченные закладки
                        </q-tooltip>
                    </q-btn>
                    <q-btn :disabled="!selected || selected.indexOf('r-') == 0" class="q-mb-sm" round dense color="blue" icon="la la-edit" size="14px" @click.stop="editBookmark">
                        <q-tooltip :delay="1500" anchor="bottom middle" content-style="font-size: 80%">
                            Редактировать закладку
                        </q-tooltip>
                    </q-btn>
                    <q-btn :disabled="!ticked.length" class="q-mb-sm" round dense color="blue" icon="la la-arrow-up" size="14px" @click.stop="moveBookmark(false)">
                        <q-tooltip :delay="1500" anchor="bottom middle" content-style="font-size: 80%">
                            Переместить отмеченные вверх
                        </q-tooltip>
                    </q-btn>
                    <q-btn :disabled="!ticked.length" class="q-mb-sm" round dense color="blue" icon="la la-arrow-down" size="14px" @click.stop="moveBookmark(true)">
                        <q-tooltip :delay="1500" anchor="bottom middle" content-style="font-size: 80%">
                            Переместить отмеченные вниз
                        </q-tooltip>
                    </q-btn>
                    <q-btn class="q-mb-sm" round dense color="blue" icon="la la-broom" size="14px" @click.stop="setDefaultBookmarks">
                        <q-tooltip :delay="1500" anchor="bottom middle" content-style="font-size: 80%">
                            Установить по умолчанию
                        </q-tooltip>
                    </q-btn>
                    <div class="space" />
                </div>

                <div class="col fit tree">
                    <div v-show="nodes.length" class="checkbox-tick-all">
                        <q-checkbox v-model="tickAll" size="36px" label="Выбрать все" @update:model-value="makeTickAll" />
                    </div>
                    <q-tree
                        v-model:selected="selected"
                        v-model:ticked="ticked"
                        v-model:expanded="expanded"
                        class="q-my-xs"
                        :nodes="nodes"
                        node-key="key"
                        tick-strategy="leaf"
                        selected-color="black"
                        :filter="search"
                        no-nodes-label="Закладок пока нет"
                        no-results-label="Ничего не найдено"
                    >
                        <template #default-header="p">
                            <div class="q-px-xs" :class="{selected: selected == p.key}">
                                {{ p.node.label }}
                            </div>
                        </template>
                    </q-tree>
                </div>
            </div>
        </div>
    </Window>
</template>

<script>
//-----------------------------------------------------------------------------
import vueComponent from '../../vueComponent.js';

import _ from 'lodash';

import Window from '../../share/Window.vue';
import * as lu from '../linkUtils';
import rstore from '../../../store/modules/reader';

const componentOptions = {
    components: {
        Window,
    },
    watch: {
        ticked() {
            this.checkAllTicked();
        },
    }    
};
class BookmarkSettings {
    _options = componentOptions;
    _props = {
        libs: Object,
        addBookmarkVisible: Boolean,
    };

    search = '';
    selected = '';
    ticked = [];
    expanded = [];
    tickAll = false;

    created() {
        this.afterInit = true;
    }

    mounted() {
    }

    init() {
        this.$refs.window.init();
    }

    get nodes() {
        const result = [];

        const expanded = [];
        this.links = {};
        this.libs.groups.forEach(group => {
            const rkey = `r-${group.r}`;
            const g = {label: group.r, key: rkey, children: []};
            this.links[rkey] = {l: group.r, c: ''};

            group.list.forEach(link => {
                const key = link.l;
                g.children.push({
                    label: (link.c ? link.c + ' ': '') + lu.removeOrigin(link.l),
                    key
                });

                this.links[key] = link;
                if (link.l == this.libs.startLink && expanded.indexOf(rkey) < 0) {
                    expanded.push(rkey);
                }

            });

            result.push(g);
        });

        if (this.afterInit) {
            this.$nextTick(() => {
                this.expanded = expanded;
            });
            this.afterInit = false;
        }

        return result;
    }

    makeTickAll() {
        if (this.tickAll) {
            const newTicked = [];
            for (const key of Object.keys(this.links)) {
                if (key.indexOf('r-') != 0)
                    newTicked.push(key);
            }
            this.ticked = newTicked;
        } else {
            this.ticked = [];
        }
    }

    checkAllTicked() {
        const ticked = new Set(this.ticked);

        let newTickAll = !!(this.nodes.length);
        for (const key of Object.keys(this.links)) {
            if (key.indexOf('r-') != 0 && !ticked.has(key))
                newTickAll = false;
        }
        this.tickAll = newTickAll;
    }

    resetSearch() {
        this.search = '';
        this.$refs.search.focus();
    }

    openSelected() {
        if (!this.selected)
            return;
        if (this.selected.indexOf('r-') === 0) {//rootLink
            this.$emit('do-action', {action: 'setRootLink', data: this.links[this.selected].l});
        } else {//selectedLink
            this.$emit('do-action', {action: 'setSelectedLink', data: this.links[this.selected].l});
        }
        this.close();
    }

    editBookmark() {
        this.$emit('do-action', {action: 'editBookmark', data: {link: this.links[this.selected].l, desc: this.links[this.selected].c}});
    }

    addBookmark() {
        this.$emit('do-action', {action: 'addBookmark'});
    }

    async delBookmark() {
        const newLibs = _.cloneDeep(this.libs);

        if (await this.$root.stdDialog.confirm(`Подтвердите удаление ${this.ticked.length} закладок:`, ' ')) {
            const ticked = new Set(this.ticked);
            for (let i = newLibs.groups.length - 1; i >= 0; i--) {
                const g = newLibs.groups[i];
                for (let j = g.list.length - 1; j >= 0; j--) {
                    if (ticked.has(g.list[j].l)) {
                        delete g.list[j];
                    }
                }
                g.list = g.list.filter(v => v);
                if (!g.list.length)
                    delete newLibs.groups[i];
                else {
                    const item = lu.getListItemByLink(g.list, g.s);
                    if (!item)
                        g.s = g.list[0].l;
                }
            }

            newLibs.groups = newLibs.groups.filter(v => v);
            this.ticked = [];
            this.selected = '';
            this.$emit('do-action', {action: 'setLibs', data: newLibs});
        }
    }

    moveBookmark(down = false) {
        const newLibs = _.cloneDeep(this.libs);

        const ticked = new Set(this.ticked);
        let moved = false;
        let prevFull = false;
        if (!down) {
            for (let i = 0; i < newLibs.groups.length; i++) {
                const g = newLibs.groups[i];
                let count = 0;
                for (let j = 0; j < g.list.length; j++) {
                    if (ticked.has(g.list[j].l)) {
                        if (j > 0 && !ticked.has(g.list[j - 1].l)) {
                            [g.list[j], g.list[j - 1]] = [g.list[j - 1], g.list[j]];
                            moved = true;
                        }
                        count++;
                    }
                }

                if (count == g.list.length && !prevFull && i > 0) {
                    const gs = newLibs.groups;
                    [gs[i], gs[i - 1]] = [gs[i - 1], gs[i]];
                    moved = true;
                } else
                    prevFull = (count == g.list.length);
            }
        } else {
            for (let i = newLibs.groups.length - 1; i >= 0; i--) {
                const g = newLibs.groups[i];
                let count = 0;
                for (let j = g.list.length - 1; j >= 0; j--) {
                    if (ticked.has(g.list[j].l)) {
                        if (j < g.list.length - 1 && !ticked.has(g.list[j + 1].l)) {
                            [g.list[j], g.list[j + 1]] = [g.list[j + 1], g.list[j]];
                            moved = true;
                        }
                        count++;
                    }
                }

                if (count == g.list.length && !prevFull && i < newLibs.groups.length - 1) {
                    const gs = newLibs.groups;
                    [gs[i], gs[i + 1]] = [gs[i + 1], gs[i]];
                    moved = true;
                } else
                    prevFull = (count == g.list.length);
            }
        }

        if (moved)
            this.$emit('do-action', {action: 'setLibs', data: newLibs});
    }

    async setDefaultBookmarks() {
        const result = await this.$root.stdDialog.prompt(`Введите 'да' для сброса всех закладок в предустановленные значения:`, ' ', {
            inputValidator: (str) => { if (str && str.toLowerCase() === 'да') return true; else return 'Удаление не подтверждено'; },
        });

        if (result && result.value && result.value.toLowerCase() == 'да') {
            this.$emit('do-action', {action: 'setLibs', data: _.cloneDeep(
                Object.assign({helpShowed: true}, rstore.libsDefaults)
            )});
        }
    }

    close() {
        this.afterInit = false;
        this.$emit('close');
    }

    keyHook(event) {
        if (this.addBookmarkVisible)
            return false;

        if (event.type == 'keydown' && event.key == 'Escape') {
            this.close();
            return true;
        }
        return false;
    }

}

export default vueComponent(BookmarkSettings);
//-----------------------------------------------------------------------------
</script>

<style scoped>
.top-panel {
    height: 50px;
    border-bottom: 1px solid gray;
    padding: 0 10px 0 12px;
}

.left-panel {
    width: 60px;
    height: 100%;
    border-right: 1px solid gray;
    overflow-x: hidden;
    overflow-y: auto;
}

.tree {
    padding: 0px 10px 10px 10px;
    overflow-x: auto;
    overflow-y: auto;
    max-width: 520px;
}

.selected {
    text-shadow: 0 0 20px yellow, 0 0 15px yellow, 0 0 10px yellow, 0 0 10px yellow, 0 0 5px yellow;
}

.checkbox-tick-all {
    border-bottom: 1px solid #bbbbbb;
    margin-bottom: 7px;
    padding: 5px 5px 2px 16px;
}

.space {
    min-height: 1px;
    width: 1px;
}
</style>
