<template>
    <Window width="600px" ref="window" @close="close">
        <template slot="header">
            <span v-show="!loading">Последние {{tableData ? tableData.length : 0}} открытых книг</span>
            <span v-show="loading"><i class="el-icon-loading" style="font-size: 25px"></i> <span style="position: relative; top: -4px">Список загружается</span></span>
        </template>

        <a ref="download" style='display: none;'></a>
        <el-table
            :data="tableData"
            style="width: 570px"
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
                min-width="85px"
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
                                style="margin: 0; vertical-align: bottom; margin-top: 20px; padding: 0 10px 0 10px"
                                :value="search" @input="search = $event.target.value"
                            />
                        </div>
                </template>

                <el-table-column
                    min-width="280px"
                    >
                    <template slot-scope="scope">
                        <div class="desc" @click="loadBook(scope.row.url)">
                            <span style="color: green">{{ scope.row.desc.author }}</span><br>
                            <span>{{ scope.row.desc.title }}</span>
                        </div>
                    </template>
                </el-table-column>

                <el-table-column
                    min-width="90px"
                    >
                    <template slot-scope="scope">
                        <a v-show="isUrl(scope.row.url)" :href="scope.row.url" target="_blank">Оригинал</a><br>
                        <a :href="scope.row.path" @click.prevent="downloadBook(scope.row.path)">Скачать FB2</a>
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
</template>

<script>
//-----------------------------------------------------------------------------
import Vue from 'vue';
import Component from 'vue-class-component';
import path from 'path';
import _ from 'lodash';

import * as utils from '../../../share/utils';
import Window from '../../share/Window.vue';
import bookManager from '../share/bookManager';
import readerApi from '../../../api/reader';

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
class RecentBooksPage extends Vue {
    loading = false;
    search = null;
    tableData = [];

    created() {
    }

    init() {
        this.$refs.window.init();

        this.$nextTick(() => {
            //this.$refs.input.focus();
        });
        (async() => {//отбражение подгрузки списка, иначе тормозит
            if (this.initing)
                return;
            this.initing = true;

            await this.updateTableData(3);
            await utils.sleep(200);

            if (bookManager.loaded) {
                const t = Date.now();
                await this.updateTableData(10);
                if (bookManager.getSortedRecent().length > 10)
                    await utils.sleep(10*(Date.now() - t));
            } else {
                let i = 0;
                let j = 5;
                while (i < 500 && !bookManager.loaded) {
                    if (i % j == 0) {
                        bookManager.sortedRecentCached = null;
                        await this.updateTableData(100);
                        j *= 2;
                    }

                    await utils.sleep(100);
                    i++;
                }
            }
            await this.updateTableData();
            this.initing = false;
        })();
    }

    rowKey(row) {
        return row.key;
    }

    async updateTableData(limit) {
        while (this.updating) await utils.sleep(100);
        this.updating = true;
        let result = [];

        this.loading = !!limit;
        const sorted = bookManager.getSortedRecent();

        for (let i = 0; i < sorted.length; i++) {
            const book = sorted[i];
            if (book.deleted)
                continue;

            if (limit && result.length >= limit)
                break;

            let d = new Date();
            d.setTime(book.touchTime);
            const t = utils.formatDate(d).split(' ');

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
            } else {//TODO: убрать в будущем
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

        /*for (let i = 0; i < result.length; i++) {
            if (!_.isEqual(this.tableData[i], result[i])) {
                this.$set(this.tableData, i, result[i]);
                await utils.sleep(10);
            }
        }
        if (this.tableData.length > result.length)
            this.tableData.splice(result.length);*/

        this.tableData = result;
        this.updating = false;
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

    async downloadBook(fb2path) {
        try {
            await readerApi.checkCachedBook(fb2path);

            const d = this.$refs.download;
            d.href = fb2path;
            d.download = path.basename(fb2path).substr(0, 10) + '.fb2';
            d.click();
        } catch (e) {
            let errMes = e.message;
            if (errMes.indexOf('404') >= 0)
                errMes = 'Файл не найден на сервере (возможно был удален как устаревший)';
            this.$alert(errMes, 'Ошибка', {type: 'error'});
        }
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

        if (!bookManager.mostRecentBook())
            this.close();
    }

    loadBook(url) {
        this.$emit('load-book', {url});
        this.close();
    }

    isUrl(url) {
        if (url)
            return (url.indexOf('file://') != 0);
        else
            return false;
    }

    close() {
        this.$emit('recent-books-toggle');
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
.desc {
    cursor: pointer;
}
</style>