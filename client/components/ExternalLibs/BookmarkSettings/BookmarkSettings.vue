<template>
    <Window ref="window" width="600px" height="95%" @close="close">
        <template slot="header">
            Настроить закладки
        </template>

        <div class="column fit">
            <div class="row items-center top-panel bg-grey-3">
                <q-btn class="q-mr-md" round dense color="blue" icon="la la-check" @click.stop="openSelected" size="16px" :disabled="!selected">
                    <q-tooltip :delay="1500" anchor="bottom middle" content-style="font-size: 80%">Открыть выбранную закладку</q-tooltip>
                </q-btn>
                <q-input class="col q-mr-sm" ref="search" rounded outlined dense bg-color="white" placeholder="Найти" v-model="search">
                    <template v-slot:append>
                        <q-icon v-if="search !== ''" name="la la-times" class="cursor-pointer" @click="resetSearch"/>
                    </template>
                </q-input>
                <q-btn round dense color="blue" icon="la la-cog" @click.stop="openOptions" size="14px">
                    <q-tooltip :delay="1500" anchor="bottom middle" content-style="font-size: 80%">Опции</q-tooltip>
                </q-btn>
            </div>

            <div class="col row">
                <div class="left-panel column items-center bg-grey-3">
                    <q-btn class="q-mb-sm" round dense color="blue" icon="la la-edit" @click.stop="editBookmark" size="14px">
                        <q-tooltip :delay="1500" anchor="bottom middle" content-style="font-size: 80%">Редактировать закладку</q-tooltip>
                    </q-btn>
                    <q-btn class="q-mb-sm" round dense color="blue" icon="la la-plus" @click.stop="addBookmark" size="14px">
                        <q-tooltip :delay="1500" anchor="bottom middle" content-style="font-size: 80%">Добавить закладку</q-tooltip>
                    </q-btn>
                    <q-btn class="q-mb-sm" round dense color="blue" icon="la la-minus" @click.stop="delBookmark" size="14px">
                        <q-tooltip :delay="1500" anchor="bottom middle" content-style="font-size: 80%">Удалить закладку</q-tooltip>
                    </q-btn>
                    <q-btn class="q-mb-sm" round dense color="blue" icon="la la-arrow-up" @click.stop="moveUp" size="14px">
                        <q-tooltip :delay="1500" anchor="bottom middle" content-style="font-size: 80%">Переместить вверх</q-tooltip>
                    </q-btn>
                    <q-btn class="q-mb-sm" round dense color="blue" icon="la la-arrow-down" @click.stop="moveDown" size="14px">
                        <q-tooltip :delay="1500" anchor="bottom middle" content-style="font-size: 80%">Переместить вниз</q-tooltip>
                    </q-btn>
                </div>

                <div class="col tree">
                    <q-tree
                      :nodes="nodes"
                      node-key="key"
                      tick-strategy="leaf"
                      :selected.sync="selected"
                      :ticked.sync="ticked"
                      :expanded.sync="expanded"
                      selected-color="black"
                      :filter="search"
                      no-nodes-label="Закладок пока нет"
                      no-results-label="Ничего не найдено"
                    >
                        <template v-slot:default-header="p">
                            <div class="q-px-xs" :class="{selected: selected == p.key}">{{ p.node.label }}</div>
                        </template>
                    </q-tree>
                </div>
            </div>
        </div>
    </Window>
</template>

<script>
//-----------------------------------------------------------------------------
import Vue from 'vue';
import Component from 'vue-class-component';
import Window from '../../share/Window.vue';

import * as lu from '../linkUtils';

const BookmarkSettingsProps = Vue.extend({
    props: {
        libs: Object,
    }
});

export default @Component({
    components: {
        Window,
    },
    watch: {
        libs: function() {
        },
    }    
})
class BookmarkSettings extends BookmarkSettingsProps {
    search = '';
    selected = '';
    ticked = [];
    expanded = [];

    created() {
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
        let i = 0;
        this.libs.groups.forEach(group => {
            const rkey = `${i}`;
            const g = {label: group.r, key: rkey, children: []};
            this.links[rkey] = group.r;

            let j = 0;
            group.list.forEach(link => {
                const key = `${i}-${j}`;
                g.children.push({
                    label: (link.c ? link.c + ' ': '') + lu.removeOrigin(link.l),
                    key
                });

                this.links[key] = link.l;
                if (link.l == this.libs.startLink && expanded.indexOf(rkey) < 0) {
                    expanded.push(rkey);
                }

                j++;
            });

            result.push(g);
            i++;
        });

        this.$nextTick(() => {
            this.expanded = expanded;
        });

        return result;
    }

    resetSearch() {
        this.search = '';
        this.$refs.search.focus();
    }

    openSelected() {
        if (!this.selected)
            return;
        if (this.selected.indexOf('-') < 0) {//rootLink
            this.$emit('do-action', {action: 'setRootLink', data: this.links[this.selected]});
        } else {//selectedLink
            this.$emit('do-action', {action: 'setSelectedLink', data: this.links[this.selected]});
        }

        //this.close();
    }

    openOptions() {
    }

    close() {
        this.$emit('close');
    }

    keyHook(event) {
        if (event.type == 'keydown' && event.key == 'Escape') {
            this.close();
            return true;
        }
        return false;
    }

}
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
    border-right: 1px solid gray;
    padding: 10px 0 10px 0;
}

.tree {
    padding: 10px;
}

.selected {
    text-shadow: 0 0 20px yellow, 0 0 15px yellow, 0 0 10px yellow, 0 0 10px yellow, 0 0 5px yellow;
}
</style>
