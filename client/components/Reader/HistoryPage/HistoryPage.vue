<template>
    <div ref="main" class="main" @click="close">
        <div class="mainWindow" @click.stop>
            <Window @close="close">
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
                    :default-sort = "{prop: 'touchDateTime', order: 'descending'}"
                    :header-cell-style = "headerCellStyle"
                    >

                    <el-table-column
                        prop="touchDateTime"
                        min-width="90px"
                        sortable
                        >
                        <template slot="header" slot-scope="scope"><!-- eslint-disable-line vue/no-unused-vars -->
                            <span style="font-size: 90%">Время<br>просм.</span>
                        </template>
                        <template slot-scope="scope"><!-- eslint-disable-line vue/no-unused-vars -->
                            <div class="desc" @click="loadBook(scope.row.url)">
                                {{ scope.row.touchDate }}<br>
                                {{ scope.row.touchTime }}
                            </div>
                        </template>
                    </el-table-column>

                    <el-table-column
                        >
                        <template slot="header" slot-scope="scope"><!-- eslint-disable-line vue/no-unused-vars -->
                            <!--el-input ref="input"
                                :value="search" @input="search = $event"
                                size="mini"
                                style="margin: 0; padding: 0; vertical-align: bottom; margin-top: 10px"
                                placeholder="Найти"/-->
                                <div class="el-input el-input--mini">
                                    <input class="el-input__inner"
                                        placeholder="Найти"
                                        style="margin: 0; padding: 0; vertical-align: bottom; margin-top: 20px; padding: 0 10px 0 10px"
                                        :value="search" @input="search = $event.target.value"
                                    />
                                </div>
                        </template>

                        <el-table-column
                            min-width="300px"
                            >
                            <template slot-scope="scope">
                                <div class="desc" @click="loadBook(scope.row.url)">
                                    <span style="color: green">{{ scope.row.desc.author }}</span><br>
                                    <span>{{ scope.row.desc.title }}</span>
                                </div>
                            </template>
                        </el-table-column>

                        <el-table-column
                            min-width="100px"
                            >
                            <template slot-scope="scope">
                                <a :href="scope.row.url" target="_blank">Оригинал</a><br>
                                <a :href="scope.row.path" :download="getFileNameFromPath(scope.row.path)">Скачать FB2</a>
                            </template>
                        </el-table-column>

                        <el-table-column
                            width="60px"
                            >
                            <template slot-scope="scope">
                                <el-button
                                    size="mini"
                                    style="width: 30px; padding: 7px 0 7px 0; margin-left: 4px"
                                    @click="handleDel(scope.row.key)"><i class="el-icon-close"></i>
                                </el-button>
                            </template>
                        </el-table-column>

                    </el-table-column>

                </el-table>
            </Window>
        </div>
    </div>
</template>

<script>
//-----------------------------------------------------------------------------
import Vue from 'vue';
import Component from 'vue-class-component';
import path from 'path';
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
            let d = new Date();
            d.setTime(book.touchTime);
            const t = formatDate(d).split(' ');

            let perc = '';
            let textLen = '';
            const p = (book.bookPosSeen ? book.bookPosSeen : (book.bookPos ? book.bookPos : 0));
            if (book.textLength) {
                perc = ` [${((p/book.textLength)*100).toFixed(2)}%]`;
                textLen = ` ${Math.round(book.textLength/1000)}k`;
            }

            const fb2 = (book.fb2 ? book.fb2 : {});
            result.push({
                touchDateTime: book.touchTime,
                touchDate: t[0],
                touchTime: t[1],
                desc: {
                    title: `"${fb2.bookTitle}"${perc}${textLen}`,
                    author: _.compact([
                        fb2.lastName,
                        fb2.firstName,
                        fb2.middleName
                    ]).join(' '),
                },
                url: book.url,
                path: book.path,
                key: book.key,
            });
        }

        const search = this.search;
        return result.filter(item => {
            return !search ||
                item.touchTime.includes(search) ||
                item.touchDate.includes(search) ||
                item.desc.title.toLowerCase().includes(search.toLowerCase()) ||
                item.desc.author.toLowerCase().includes(search.toLowerCase())
        });
    }

    headerCellStyle(cell) {
        let result = {margin: 0, padding: 0};
        if (cell.columnIndex > 0) {
            result['border-bottom'] = 0;
        }
        if (cell.rowIndex > 0) {
            result.height = '0px';
            result['border-right'] = 0;
        }
        return result;
    }

    getFileNameFromPath(fb2Path) {
        return path.basename(fb2Path).substr(0, 10) + '.fb2';
    }

    openOriginal(url) {
        window.open(url, '_blank');
    }

    openFb2(path) {
        window.open(path, '_blank');
    }

    handleDel(key) {
        this.commit('reader/delOpenedBook', {key});
    }

    loadBook(url) {
        this.$emit('load-book', {url});
    }

    close() {
        this.$emit('history-toggle');
    }

    keyHook(event) {
        if (event.type == 'keydown' && event.code == 'Escape') {
            this.close();
        }
        return true;
    }
}
//-----------------------------------------------------------------------------
</script>

<style scoped>
.main {
    position: absolute;
    width: 100%;
    height: 100%;
    z-index: 50;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.mainWindow {
    height: 100%;
    display: flex;
}

.desc {
    cursor: pointer;
}
</style>