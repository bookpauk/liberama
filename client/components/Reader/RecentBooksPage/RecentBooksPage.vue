<template>
    <Window width="600px" ref="window" @close="close">
        <template slot="header">
            <span v-show="!loading">Последние {{tableData ? tableData.length : 0}} открытых книг</span>
            <span v-if="loading"><q-spinner class="q-mr-sm" color="lime-12" size="20px" :thickness="7"/>Список загружается</span>
        </template>

        <a ref="download" style='display: none;'></a>

        <q-table
            class="recent-books-table col"
            :data="tableData"
            :columns="columns"
            row-key="key"
            :pagination.sync="pagination"
            separator="cell"
            hide-bottom
            virtual-scroll
            dense
        > 
            <template v-slot:header="props">
                <q-tr :props="props">
                    <q-th class="td-mp" style="width: 25px" key="num" :props="props"><span v-html="props.cols[0].label"></span></q-th>
                    <q-th class="td-mp break-word" style="width: 77px" key="date" :props="props"><span v-html="props.cols[1].label"></span></q-th>
                    <q-th class="td-mp" style="width: 332px" key="desc" :props="props" colspan="4">
                        <q-input ref="input" outlined dense style="position: absolute; top: 6px; left: 100px; width: 370px" size="10px" bg-color="white"
                            placeholder="Найти"
                            v-model="search"
                        />

                        <span v-html="props.cols[2].label"></span>
                    </q-th>
                </q-tr>
            </template>

            <template v-slot:body="props">
                <q-tr :props="props">
                    <q-td key="num" :props="props" class="td-mp" auto-width>
                        <div class="break-word" style="width: 25px">
                            {{ props.row.num }}
                        </div>
                    </q-td>

                    <q-td key="date" :props="props" class="td-mp clickable" @click="loadBook(props.row.url)" auto-width>
                        <div class="break-word" style="width: 68px">
                            {{ props.row.touchDate }}<br>
                            {{ props.row.touchTime }}
                        </div>
                    </q-td>

                    <q-td key="desc" :props="props" class="td-mp clickable" @click="loadBook(props.row.url)" auto-width>
                        <div class="break-word" style="width: 332px; font-size: 90%">
                            <div style="color: green">{{ props.row.desc.author }}</div>
                            <div>{{ props.row.desc.title }}</div>
                        </div>
                    </q-td>

                    <q-td key="links" :props="props" class="td-mp" auto-width>
                        <div class="break-word" style="width: 75px; font-size: 90%">
                            <a v-show="isUrl(props.row.url)" :href="props.row.url" target="_blank">Оригинал</a><br>
                            <a :href="props.row.path" @click.prevent="downloadBook(props.row.path)">Скачать FB2</a>
                        </div>
                    </q-td>

                    <q-td key="close" :props="props" class="td-mp" auto-width>
                        <div style="width: 38px">
                            <q-btn
                                dense
                                style="width: 30px; height: 30px; padding: 7px 0 7px 0; margin-left: 4px"
                                @click="handleDel(props.row.key)">
                                <q-icon class="la la-times" size="16px" style="top: -5px"/>
                            </q-btn>
                        </div>
                    </q-td>
                    <q-td key="last" :props="props" class="no-mp">
                    </q-td>
                </q-tr>
            </template>
        </q-table>

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
    columns = [];
    pagination = {};

    created() {
        this.pagination = {rowsPerPage: 0};

        this.columns = [
            {
                name: 'num',
                label: '#',
                align: 'center',
                sortable: true,
                field: 'num',
            },
            {
                name: 'date',
                label: 'Время<br>просм.',
                align: 'left',
                field: 'touchDateTime',
                sortable: true,
                sort: (a, b, rowA, rowB) => rowA.touchDateTime - rowB.touchDateTime,
            },
            {
                name: 'desc',
                label: 'Название',
                align: 'left',
                field: 'descString',
                sortable: true,
            },
            {
                name: 'links',
                label: '',
                align: 'left',
            },
            {
                name: 'close',
                label: '',
                align: 'left',
            },
            {
                name: 'last',
                label: '',
                align: 'left',
            },
        ];
    }

    init() {
        this.$refs.window.init();

        this.$nextTick(() => {
            this.$refs.input.focus();
        });
        (async() => {//подгрузка списка
            if (this.initing)
                return;
            this.initing = true;


            if (!bookManager.loaded) {
                await this.updateTableData(10);
                //для отзывчивости
                await utils.sleep(100);
                let i = 0;
                let j = 5;
                while (i < 500 && !bookManager.loaded) {
                    if (i % j == 0) {
                        bookManager.sortedRecentCached = null;
                        await this.updateTableData(20);
                        j *= 2;
                    }

                    await utils.sleep(100);
                    i++;
                }
            } else {
                //для отзывчивости
                await utils.sleep(100);
            }
            await this.updateTableData();
            this.initing = false;
        })();
    }

    async updateTableData(limit) {
        while (this.updating) await utils.sleep(100);
        this.updating = true;
        let result = [];

        this.loading = !!limit;
        const sorted = bookManager.getSortedRecent();

        let num = 0;
        for (let i = 0; i < sorted.length; i++) {
            const book = sorted[i];
            if (book.deleted)
                continue;

            num++;
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
                num,
                touchDateTime: book.touchTime,
                touchDate: t[0],
                touchTime: t[1],
                desc: {
                    author,
                    title: `${title}${perc}${textLen}`,
                },
                descString: `${author}${title}${perc}${textLen}`,
                url: book.url,
                path: book.path,
                key: book.key,
            });
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
        this.$emit('recent-books-close');
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
.recent-books-table {
    width: 600px;
    overflow-y: auto;
    overflow-x: hidden;
}

.clickable {
    cursor: pointer;
}

.td-mp {
    margin: 0 !important;
    padding: 4px 4px 4px 4px !important;
    border-bottom: 1px solid #ddd;
}

.no-mp {
    margin: 0 !important;
    padding: 0 !important;
    border-bottom: 1px solid #ddd;
}

.break-word {
    line-height: 180%;
    overflow-wrap: break-word;
    word-wrap: break-word;
    white-space: normal;
}

</style>

<style>
.recent-books-table .q-table__middle {
    height: 100%;
    overflow-x: hidden;
}

.recent-books-table thead tr:first-child th {
    position: sticky;
    z-index: 1;
    top: 0;
    background-color: #c1f4cd;
}
</style>
