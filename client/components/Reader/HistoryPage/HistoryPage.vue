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
                    :row-key = "rowKey"
                    >

                    <el-table-column
                        type="index"
                        width="35px"
                        >
                    </el-table-column>
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
                                        ref="input"
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
                                <a v-show="isUrl(scope.row.url)" :href="scope.row.url" target="_blank">Оригинал</a><br>
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
import bookManager from '../share/bookManager';

export default @Component({
    components: {
        Window,
    },
    watch: {
        search: function() {
            this.updateTableData();
        }
    },
})
class HistoryPage extends Vue {
    search = null;
    tableData = null;

    created() {
    }

    init() {
        this.updateTableData();
        this.mostRecentBook = bookManager.mostRecentBook();
        this.$nextTick(() => {
            this.$refs.input.focus();
        });
    }

    rowKey(row) {
        return row.key;
    }

    updateTableData() {
        let result = [];

        const sorted = bookManager.getSortedRecent();
        for (let i = 0; i < sorted.length; i++) {
            const book = sorted[i];
            if (book.deleted)
                continue;

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

            let title = fb2.bookTitle;
            if (title)
                title = `"${title}"`;
            else
                title = '';

            let author = '';
            if (fb2.author) {
                const authorNames = fb2.author.map(a => _.compact([
                    a.lastName,
                    a.firstName,
                    a.middleName
                ]).join(' '));
                author = authorNames.join(', ');
            } else {
                author = _.compact([
                    fb2.lastName,
                    fb2.firstName,
                    fb2.middleName
                ]).join(' ');
            }
            author = (author ? author : (fb2.bookTitle ? fb2.bookTitle : book.url));

            result.push({
                touchDateTime: book.touchTime,
                touchDate: t[0],
                touchTime: t[1],
                desc: {
                    title: `${title}${perc}${textLen}`,
                    author,
                },
                url: book.url,
                path: book.path,
                key: book.key,
            });
            if (result.length >= 100)
                break;
        }

        const search = this.search;
        result = result.filter(item => {
            return !search ||
                item.touchTime.includes(search) ||
                item.touchDate.includes(search) ||
                item.desc.title.toLowerCase().includes(search.toLowerCase()) ||
                item.desc.author.toLowerCase().includes(search.toLowerCase())
        });

        this.tableData = result;
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

    async handleDel(key) {
        await bookManager.delRecentBook({key});
        this.updateTableData();

        const newRecent = bookManager.mostRecentBook();

        if (!(this.mostRecentBook && newRecent && this.mostRecentBook.key == newRecent.key))
            this.$emit('load-book', newRecent);

        this.mostRecentBook = newRecent;
        if (!this.mostRecentBook)
            this.close();
    }

    loadBook(url) {
        this.$emit('load-book', {url});
        this.close();
    }

    isUrl(url) {
        return (url.indexOf('file://') != 0);
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