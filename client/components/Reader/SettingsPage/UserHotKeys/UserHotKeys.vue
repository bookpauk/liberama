<template>
    <div class="table col column no-wrap">
        <!-- header -->
        <div class="table-row row">
            <div class="desc q-pa-sm bg-green-4">Действие</div>
            <div class="hotKeys col q-pa-sm bg-green-4 row no-wrap">
                <span>Сочетания клавиш</span>
                <q-input ref="input" outlined dense rounded bg-color="grey-4"
                    placeholder="Найти"
                    v-model="search"
                    @click.stop
                />
                <div class="q-ml-sm column justify-center">
                    <q-btn class="bg-grey-4 text-grey-6" style="height: 35px; width: 35px" rounded flat icon="la la-broom" @click="defaultHotKeyAll">
                        <q-tooltip :delay="1000" anchor="top middle" self="bottom middle" content-style="font-size: 80%">
                            Установить все сочетания по умолчанию
                        </q-tooltip>
                    </q-btn>
                </div>
            </div>
        </div>

        <!-- body -->
        <div class="table-row row" v-for="(action, index) in tableData" :key="index">
            <div class="desc q-pa-sm">{{ rstore.readerActions[action] }}</div>
            <div class="hotKeys col q-pa-sm">
                <q-chip removable color="grey-7" text-color="white" v-for="(code, index) in value[action]" :key="index" @remove="removeCode(action, code)">
                    {{ code }}
                </q-chip>
            </div>
            <div class="column q-pa-xs">
                <q-icon
                    name="la la-plus-circle"
                    class="button bg-green-8 text-white"
                    @click="addHotKey(action)"
                    v-ripple
                >
                    <q-tooltip :delay="1000" anchor="top middle" self="bottom middle" content-style="font-size: 80%">
                        Добавить сочетание клавиш
                    </q-tooltip>
                </q-icon>
                <q-icon
                    name="la la-broom"
                    class="button text-grey-5"
                    @click="defaultHotKey(action)"
                    v-ripple
                >
                    <q-tooltip :delay="1000" anchor="top middle" self="bottom middle" content-style="font-size: 80%">
                        По умолчанию
                    </q-tooltip>
                </q-icon>
            </div>
        </div>
    </div>
</template>

<script>
//-----------------------------------------------------------------------------
import Vue from 'vue';
import Component from 'vue-class-component';

import rstore from '../../../../store/modules/reader';
//import * as utils from '../../share/utils';

const UserHotKeysProps = Vue.extend({
    props: {
        value: Object,
        //prop: { type: Number, default: 0 },
    }
});

export default @Component({
    watch: {
        search: function() {
            this.updateTableData();
        },
        value: function() {
            this.updateTableData();
        }
    },
})
class UserHotKeys extends UserHotKeysProps {
    search = '';
    rstore = {};
    tableData = [];

    created() {
        this.rstore = rstore;
    }

    mounted() {
        this.updateTableData();
    }

    updateTableData() {
        let result = rstore.hotKeys.map(hk => hk.name);

        const search = this.search.toLowerCase();
        const codesIncludeSearch = (action) => {
            for (const code of this.value[action]) {
                if (code.toLowerCase().includes(search))
                    return true;
            }
            return false;
        };

        result = result.filter(item => {
            return !search ||
                rstore.readerActions[item].toLowerCase().includes(search) ||
                codesIncludeSearch(item)
        });

        this.tableData = result;
    }

    removeCode(action, code) {
    }

    addHotKey(action) {
    }

    defaultHotKey(action) {
    }

    defaultHotKeyAll() {
    }
}
//-----------------------------------------------------------------------------
</script>

<style scoped>
.table {
    border-left: 1px solid grey;
    border-top: 1px solid grey;
}

.table-row {
    border-right: 1px solid grey;
    border-bottom: 1px solid grey;
}

.desc {
    width: 100px;
}

.hotKeys {
    border-left: 1px solid grey;    
}

.button {
    font-size: 25px;
    border-radius: 25px;
    cursor: pointer;
}
</style>