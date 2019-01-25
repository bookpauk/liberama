<template>
    <div ref="main" class="main">
        <Window class="window">
            <template slot="header">
                Последние 100 открытых книг
            </template>

            <el-table
                :data="tableData"
                style="width: 100%"
                size="mini"
                height="1px"
                stripe
                border
                :default-sort = "{prop: 'touchTime', order: 'descending'}"
                >

                <el-table-column
                    prop="touchTime"
                    min-width="120px"
                    sortable
                    >
                    <template slot="header" slot-scope="scope">
                        Время<br>просмотра
                    </template>
                </el-table-column>

                <el-table-column
                    min-width="300px"
                    >
                    <template slot="header" slot-scope="scope">
                        <el-input
                            v-model="search"
                            size="mini"
                            placeholder="Найти"/>
                    </template>
                    <template slot-scope="scope">
                        <span>{{ scope.row.desc.author }}</span><br>
                        <span>{{ `"${scope.row.desc.title}"` }}</span>
                    </template>                    
                </el-table-column>

                <el-table-column
                    >
                    <template slot-scope="scope">
                        <el-button
                            size="mini"
                            @click="handleDel(scope.$index, scope.row)">Убрать
                        </el-button>
                    </template>
                </el-table-column>

            </el-table>
        </Window>
    </div>
</template>

<script>
//-----------------------------------------------------------------------------
import Vue from 'vue';
import Component from 'vue-class-component';
import _ from 'lodash';
import {formatDate} from '../../../share/utils';
import Window from '../../share/Window.vue';

export default @Component({
    components: {
        Window,
    },
})
class HistoryPage extends Vue {
    search = null;

    created() {
        this.commit = this.$store.commit;
        this.reader = this.$store.state.reader;
    }

    get tableData() {
        const state = this.reader;
        let result = [];

        for (let bookKey in state.openedBook) {
            const book = state.openedBook[bookKey];
            let touchTime = new Date();
            touchTime.setTime(book.touchTime);

            result.push({
                touchTime: formatDate(touchTime),
                desc: {
                    title: book.fb2.bookTitle,
                    author: _.compact([
                        book.fb2.lastName,
                        book.fb2.firstName,
                        book.fb2.middleName
                    ]).join(' '),
                }
            });
        }

        return result;
    }

    keyHook(event) {
        if (event.type == 'keydown' && event.code == 'Escape') {
            this.$emit('history-toggle');
            return true;
        }
    }
}
//-----------------------------------------------------------------------------
</script>

<style scoped>
.main {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.window {
    min-width: 200px;
    max-width: 600px;
}

</style>