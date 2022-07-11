<template>
    <Window ref="window" width="600px" @close="close">
        <template #header>
            <span v-show="!loading">{{ header }}</span>
            <span v-if="loading"><q-spinner class="q-mr-sm" color="lime-12" size="20px" :thickness="7" />
                Список загружается
            </span>
        </template>

        <a ref="download" style="display: none;" target="_blank"></a>

        <div id="vs-container" ref="vsContainer" class="recent-books-scroll col">
            <div ref="header" class="scroll-header bg-blue-2">
                <q-input 
                    ref="input" v-model="search"
                    outlined rounded dense
                    style="position: relative; top: 4px; left: 200px; width: 350px" bg-color="white"
                    placeholder="Найти"
                    @click.stop
                >
                    <template #append>
                        <q-icon v-if="search !== ''" name="la la-times" class="cursor-pointer" @click.stop="resetSearch" />
                    </template>
                </q-input>
            </div>

            <q-virtual-scroll
                v-slot="{ item, index }"
                :items="tableData"
                scroll-target="#vs-container"
                virtual-scroll-item-size="80"
                @virtual-scroll="onScroll"
            >
                <div class="table-row row" :class="{even: index % 2 > 0, 'active-book': item.active}">
                    <div class="row-part row justify-center items-center" style="width: 80px">
                        {{ item.num }}
                    </div>

                    <div class="row-part column items-stretch break-word clickable" style="width: 350px; font-size: 80%" @click="loadBook(item)">
                        <div class="column col">
                            <div style="color: green">
                                {{ item.desc.author }}
                            </div>
                            <div>{{ item.desc.title }}</div>
                        </div>
                        <div class="read-bar" :style="`width: ${340*item.readPart}px`"></div>
                    </div>

                    <div class="row-part column justify-center" style="width: 80px; font-size: 80%">
                        <a v-show="isUrl(item.url)" :href="item.url" target="_blank">Оригинал</a><br>
                        <a :href="item.path" @click.prevent="downloadBook(item.path, item.fullTitle)">Скачать FB2</a>
                    </div>

                    <div class="row-part column justify-center">
                        <q-btn
                            dense
                            style="width: 30px; height: 30px; padding: 7px 0 7px 0; margin-left: 4px"
                            @click="handleDel(item.key)"
                        >
                            <q-icon class="la la-times" size="14px" />
                        </q-btn>
                    </div>
                </div>
            </q-virtual-scroll>
        </div>

        <!--q-table
            class="recent-books-table col"
            :rows="tableData"
            row-key="key"
            :columns="columns"
            :pagination="pagination"
            separator="cell"
            hide-bottom
            virtual-scroll
            dense
        > 
            <template #header="props">
                <q-tr :props="props">
                    <q-th key="num" class="td-mp" style="width: 25px" :props="props">
                        <span v-html="props.cols[0].label"></span>
                    </q-th>
                    <q-th key="date" class="td-mp break-word" style="width: 77px" :props="props">
                        <span v-html="props.cols[1].label"></span>
                    </q-th>
                    <q-th key="desc" class="td-mp" style="width: 300px" :props="props" colspan="4">
                        <q-input 
                            ref="input" v-model="search"
                            outlined dense rounded style="position: absolute; top: 6px; left: 90px; width: 350px" bg-color="white"
                            placeholder="Найти"                            
                            @click.stop
                        >
                            <template #append>
                                <q-icon v-if="search !== ''" name="la la-times" class="cursor-pointer" @click.stop="resetSearch" />
                            </template>
                        </q-input>
                        <span v-html="props.cols[2].label"></span>
                    </q-th>
                </q-tr>
            </template>

            <template #body="props">
                <q-tr :props="props">
                    <q-td key="num" :props="props" class="td-mp" auto-width>
                        <div class="break-word" style="width: 25px">
                            {{ props.row.num }}
                        </div>
                    </q-td>

                    <q-td key="date" auto-width :props="props" class="td-mp clickable" @click="loadBook(props.row)">
                        <div class="break-word" style="width: 68px">
                            {{ props.row.touchDate }}<br>
                            {{ props.row.touchTime }}
                        </div>
                    </q-td>

                    <q-td key="desc" auto-width :props="props" class="td-mp clickable" @click="loadBook(props.row)">
                        <div class="break-word" style="width: 300px; font-size: 90%">
                            <div style="color: green">
                                {{ props.row.desc.author }}
                            </div>
                            <div>{{ props.row.desc.title }}</div>
                            <div class="read-bar" :style="`width: ${300*props.row.readPart}px`"></div>
                        </div>
                    </q-td>

                    <q-td key="links" :props="props" class="td-mp" auto-width>
                        <div class="break-word" style="width: 75px; font-size: 90%">
                            <a v-show="isUrl(props.row.url)" :href="props.row.url" target="_blank">Оригинал</a><br>
                            <a :href="props.row.path" @click.prevent="downloadBook(props.row.path, props.row.fullTitle)">Скачать FB2</a>
                        </div>
                    </q-td>

                    <q-td key="close" :props="props" class="td-mp" auto-width>
                        <div style="width: 38px">
                            <q-btn
                                dense
                                style="width: 30px; height: 30px; padding: 7px 0 7px 0; margin-left: 4px"
                                @click="handleDel(props.row.key)"
                            >
                                <q-icon class="la la-times" size="14px" />
                            </q-btn>
                        </div>
                    </q-td>
                    <q-td key="last" :props="props" class="no-mp">
                    </q-td>
                </q-tr>
            </template>
        </q-table-->
    </Window>
</template>

<script>
//-----------------------------------------------------------------------------
import vueComponent from '../../vueComponent.js';

import path from 'path-browserify';
//import _ from 'lodash';

import * as utils from '../../../share/utils';
import LockQueue from '../../../share/LockQueue';
import Window from '../../share/Window.vue';
import bookManager from '../share/bookManager';
import readerApi from '../../../api/reader';

const componentOptions = {
    components: {
        Window,
    },
    watch: {
        search: function() {
            this.updateTableData();
        }
    },
};
class RecentBooksPage {
    _options = componentOptions;

    loading = false;
    search = '';
    tableData = [];
    sortMethod = '';

    created() {
        this.lastScrollTop1 = 0;
        this.lastScrollTop2 = 0;

        this.lock = new LockQueue(100);
    }

    init() {
        this.$refs.window.init();

        this.$nextTick(() => {
            //this.$refs.input.focus();//плохо на планшетах
        });

        this.updateTableData();//no await
    }

    async updateTableData() {
        await this.lock.get();
        try {
            let result = [];

            const sorted = bookManager.getSortedRecent();
            const activeBook = bookManager.mostRecentBook();

            //подготовка полей
            for (const book of sorted) {
                if (book.deleted)
                    continue;

                let d = new Date();
                d.setTime(book.touchTime);
                const touchTime = utils.formatDate(d);

                let readPart = 0;
                let perc = '';
                let textLen = '';
                const p = (book.bookPosSeen ? book.bookPosSeen : (book.bookPos ? book.bookPos : 0));
                if (book.textLength) {
                    readPart = p/book.textLength;
                    perc = ` [${(readPart*100).toFixed(2)}%]`;
                    textLen = ` ${Math.round(book.textLength/1000)}k`;
                }

                const bt = utils.getBookTitle(book.fb2);

                let title = bt.bookTitle;
                title = (title ? `"${title}"`: '');
                const author = (bt.author ? bt.author : (bt.bookTitle ? bt.bookTitle : (book.uploadFileName ? book.uploadFileName : book.url)));

                result.push({
                    touchTime,
                    desc: {
                        author,
                        title: `${title}${perc}${textLen}`,
                    },
                    readPart,
                    url: book.url,
                    path: book.path,
                    fullTitle: bt.fullTitle,
                    key: book.key,
                    sameBookKey: book.sameBookKey,
                    active: (activeBook.key == book.key),

                    //для сортировки
                    addTimeRaw: book.addTime,
                    touchTimeRaw: book.touchTime,
                    descString: `${author}${title}${perc}${textLen}`,
                });
            }

            //нумерация
            let num = 0;

            result.sort((a, b) => b.addTimeRaw - a.addTimeRaw);
            for (const book of result) {
                num++;
                book.num = num;
            }

            //фильтрация
            const search = this.search;
            if (search) {
                result = result.filter(item => {
                    return !search ||
                        item.touchTime.includes(search) ||
                        item.desc.title.toLowerCase().includes(search.toLowerCase()) ||
                        item.desc.author.toLowerCase().includes(search.toLowerCase())
                });
            }

            //сортировка
            switch (this.sortMethod) {
                case 'addTimeDesc':
                    result.sort((a, b) => b.addTimeRaw - a.addTimeRaw);
                    break;
                case 'addTimeAsc':
                    result.sort((a, b) => a.addTimeRaw - b.addTimeRaw);
                    break;
                case 'touchTimeDesc':
                    result.sort((a, b) => b.touchTimeRaw - a.touchTimeRaw);
                    break;
                case 'touchTimeAsc':
                    result.sort((a, b) => a.touchTimeRaw - b.touchTimeRaw);
                    break;
            }

            //группировка
            const groups = {};
            const newResult = [];
            for (const book of result) {
                if (book.sameBookKey !== undefined) {
                    if (!groups[book.sameBookKey]) {
                        groups[book.sameBookKey] = [];
                        book.group = groups[book.sameBookKey];
                        newResult.push(book);
                    } else {
                        groups[book.sameBookKey].push(book);
                    }
                } else {
                    newResult.push(book);
                }
            }
            result = newResult;

            //другие стадии
            //.....

            this.tableData = result;
        } finally {
            this.lock.ret();
        }
    }

    /*async updateTableData(limit) {
        while (this.updating) await utils.sleep(100);
        this.updating = true;
        let result = [];

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

            let readPart = 0;
            let perc = '';
            let textLen = '';
            const p = (book.bookPosSeen ? book.bookPosSeen : (book.bookPos ? book.bookPos : 0));
            if (book.textLength) {
                readPart = p/book.textLength;
                perc = ` [${(readPart*100).toFixed(2)}%]`;
                textLen = ` ${Math.round(book.textLength/1000)}k`;
            }

            const bt = utils.getBookTitle(book.fb2);

            let title = bt.bookTitle;
            title = (title ? `"${title}"`: '');
            const author = (bt.author ? bt.author : (bt.bookTitle ? bt.bookTitle : (book.uploadFileName ? book.uploadFileName : book.url)));

            result.push({
                num,
                touchDateTime: book.touchTime,
                touchDate: t[0],
                touchTime: t[1],
                desc: {
                    author,
                    title: `${title}${perc}${textLen}`,
                },
                readPart,
                descString: `${author}${title}${perc}${textLen}`,//для сортировки
                url: book.url,
                path: book.path,
                fullTitle: bt.fullTitle,
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

        this.tableData = result;
        this.updating = false;
    }*/

    resetSearch() {
        this.search = '';
        this.$refs.input.focus();
    }

    wordEnding(num) {
        const endings = ['ов', '', 'а', 'а', 'а', 'ов', 'ов', 'ов', 'ов', 'ов'];
        const deci = num % 100;
        if (deci > 10 && deci < 20) {
            return 'ов';
        } else {
            return endings[num % 10];
        }
    }

    get header() {
        const len = (this.tableData ? this.tableData.length : 0);
        return `${(this.search ? 'Найдено' : 'Всего')} ${len} файл${this.wordEnding(len)}`;
    }

    async downloadBook(fb2path, fullTitle) {
        try {
            await readerApi.checkCachedBook(fb2path);

            const d = this.$refs.download;
            d.href = fb2path;
            try {
                const fn = utils.makeValidFilename(fullTitle);
                d.download = fn.substring(0, 100) + '.fb2';
            } catch(e) {
                d.download = path.basename(fb2path).substr(0, 10) + '.fb2';
            }

            d.click();
        } catch (e) {
            let errMes = e.message;
            if (errMes.indexOf('404') >= 0)
                errMes = 'Файл не найден на сервере (возможно был удален как устаревший)';
            this.$root.stdDialog.alert(errMes, 'Ошибка', {color: 'negative'});
        }
    }

    async handleDel(key) {
        await bookManager.delRecentBook({key});
        //this.updateTableData();//обновление уже происходит Reader.bookManagerEvent

        if (!bookManager.mostRecentBook())
            this.close();
    }

    loadBook(row) {
        this.$emit('load-book', {url: row.url, path: row.path});
        this.close();
    }

    isUrl(url) {
        if (url)
            return (url.indexOf('disk://') != 0);
        else
            return false;
    }

    onScroll() {
        const curScrollTop = this.$refs.vsContainer.scrollTop;

        if (curScrollTop - this.lastScrollTop1 > 150) {
            this.$refs.header.style.top = `-${this.$refs.header.offsetHeight}px`;
            this.$refs.header.style.transition = 'top 0.2s ease 0s';

            this.lastScrollTop1 = curScrollTop;
        } else if (curScrollTop - this.lastScrollTop2 < 0) {
            this.$refs.header.style.position = 'sticky';
            this.$refs.header.style.top = 0;

            this.lastScrollTop1 = curScrollTop;
        }

        this.lastScrollTop2 = curScrollTop;
    }

    close() {
        this.$emit('recent-books-close');
    }

    keyHook(event) {
        if (!this.$root.stdDialog.active && event.type == 'keydown' && event.key == 'Escape') {
            this.close();
        }
        return true;
    }
}

export default vueComponent(RecentBooksPage);
//-----------------------------------------------------------------------------
</script>

<style scoped>
.recent-books-scroll {
    width: 573px;
    overflow-y: auto;
    overflow-x: hidden;
}

.scroll-header {
    height: 50px;
    position: sticky;
    z-index: 1;
    top: 0;
    border-bottom: 2px solid #aaaaaa;
}

.table-row {
    min-height: 80px;
    border-bottom: 1px solid #cccccc;
}

.row-part {
    padding: 4px 4px 4px 4px;
}

.clickable {
    cursor: pointer;
}

.break-word {
    line-height: 150%;
    overflow-wrap: break-word;
    word-wrap: break-word;
    white-space: normal;
}

.read-bar {
    height: 3px;
    background-color: #aaaaaa;
}

.even {
    background-color: #f0f0f0;
}

.active-book {
    background-color: #b0f0b0 !important;
}
</style>
