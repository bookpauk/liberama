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
            </div>
        </div>

        <!-- body -->
        <div class="table-row row" v-for="(action, index) in tableData" :key="index">
            <div class="desc q-pa-sm">{{ rstore.readerActions[action] }}</div>
            <div class="hotKeys col q-pa-sm">
                <q-chip removable color="grey-8" text-color="white" v-for="(code, index) in value[action]" :key="index" @remove="removeCode(action, code)">
                    {{ code }}
                </q-chip>
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
</style>