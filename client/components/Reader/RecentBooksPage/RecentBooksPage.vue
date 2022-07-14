<template>
    <Window ref="window" width="600px" @close="close">
        <template #header>
            <span v-show="!loading">{{ header }}</span>
            <span v-if="loading"><q-spinner class="q-mr-sm" color="lime-12" size="20px" :thickness="7" />
                Список загружается
            </span>
        </template>

        <template #buttons>
            <div
                class="row justify-center items-center"
                :class="{'header-button': !archive, 'header-button-pressed': archive}" 
                @mousedown.stop @click="archiveToggle"
            >
                <q-icon class="q-mr-xs" name="la la-archive" size="20px" />
                <span style="font-size: 90%">Архив</span>
                <q-tooltip :delay="1500" anchor="bottom middle" content-style="font-size: 80%">
                    {{ (archive ? 'Скрыть архивные' : 'Показать архивные') }}
                </q-tooltip>
            </div>
        </template>

        <a ref="download" style="display: none;" target="_blank"></a>

        <div id="vs-container" ref="vsContainer" class="recent-books-scroll col">
            <div ref="header" class="scroll-header row bg-blue-2">
                <q-btn class="tool-button" round @click="showSameBookClick">
                    <q-icon name="la la-caret-right" class="icon" :class="{'expanded-icon': showSameBook}" color="green-8" size="24px" />
                    <q-tooltip :delay="1500" anchor="bottom middle" content-style="font-size: 80%">
                        Показать/скрыть версии книг
                    </q-tooltip>
                </q-btn>

                <q-btn class="tool-button" round @click="scrollToBegin">
                    <q-icon name="la la-arrow-up" color="green-8" size="24px" />
                    <q-tooltip :delay="1500" anchor="bottom middle" content-style="font-size: 80%">
                        В начало списка
                    </q-tooltip>
                </q-btn>

                <q-btn class="tool-button" round @click="scrollToEnd">
                    <q-icon name="la la-arrow-down" color="green-8" size="24px" />
                    <q-tooltip :delay="1500" anchor="bottom middle" content-style="font-size: 80%">
                        В конец списка
                    </q-tooltip>
                </q-btn>

                <q-btn class="tool-button" round @click="scrollToActiveBook">
                    <q-icon name="la la-location-arrow" color="green-8" size="24px" />
                    <q-tooltip :delay="1500" anchor="bottom middle" content-style="font-size: 80%">
                        На текущую книгу
                    </q-tooltip>
                </q-btn>

                <q-input 
                    ref="input"
                    v-model="search"
                    class="q-ml-sm q-mt-xs"
                    outlined dense
                    style="width: 185px"
                    bg-color="white"
                    placeholder="Найти"
                    @click.stop
                >
                    <template #append>
                        <q-icon v-if="search !== ''" name="la la-times" class="cursor-pointer" @click.stop="resetSearch" />
                    </template>
                </q-input>

                <q-select
                    ref="sortMethod"
                    v-model="sortMethod"
                    class="q-ml-sm q-mt-xs"
                    :options="sortMethodOptions"
                    style="width: 180px"
                    bg-color="white"
                    dropdown-icon="la la-angle-down la-sm"
                    outlined dense emit-value map-options display-value-sanitize options-sanitize
                    options-html display-value-html

                    @update:model-value="sortMethodSelected"
                >
                    <q-tooltip :delay="1500" anchor="bottom middle" content-style="font-size: 80%">
                        Метод сортировки
                    </q-tooltip>

                    <template #selected-item="scope">
                        <div style="height: 28px; padding-top: 2px; overflow: hidden" v-html="scope.opt.label" />
                    </template>
                </q-select>
            </div>

            <q-virtual-scroll
                ref="virtualScroll"
                v-slot="{ item, index }"
                :items="tableData"
                scroll-target="#vs-container"
                virtual-scroll-item-size="80"
                @virtual-scroll="onScroll"
            >
                <div class="table-row row" :class="{even: index % 2 > 0, 'active-book': item.active, 'active-parent-book': item.activeParent}">
                    <div v-show="item.inGroup" class="row-part column justify-center items-center" style="width: 40px">
                        <q-icon name="la la-code-branch" size="24px" style="color: green" />
                    </div>

                    <div class="row-part column justify-center items-stretch" style="width: 80px">
                        <div class="col row justify-center items-center clickable" @click="loadBook(item)">
                            <div v-show="isLoadedCover(item.coverPageUrl)" v-html="getCoverHtml(item.coverPageUrl)" />
                            <q-icon v-show="!isLoadedCover(item.coverPageUrl)" name="la la-book" size="40px" style="color: #dddddd" />
                        </div>

                        <div v-show="!showSameBook && item.group && item.group.length > 0" class="row justify-center" style="font-size: 70%">
                            {{ (item.group ? item.group.length + 1 : 0) }} верси{{ wordEnding((item.group ? item.group.length + 1 : 0), 1) }}
                        </div>
                    </div>

                    <div class="row-part column items-stretch clickable break-word" @click="loadBook(item)">
                        <div 
                            class="col" style="border: 1px solid #cccccc; border-bottom: 0; padding: 4px; line-height: 140%;"
                            :style="{ 'width': (380 - 40*(+item.inGroup)) + 'px' }"
                        >
                            <div class="text-green-10" style="font-size: 80%">
                                {{ item.desc.author }}
                            </div>
                            <div style="font-size: 75%">
                                {{ item.desc.title }}
                            </div>
                        </div>

                        <div class="row" style="font-size: 10px">
                            <div class="row justify-center items-center row-info-top" style="width: 60px">
                                {{ item.desc.textLen }}
                            </div>

                            <div class="row items-center row-info-top" :style="`width: ${(260 - 40*(+item.inGroup))}px; padding: 1px`">
                                <div class="read-bar" :style="`width: ${100*item.readPart}%`"></div>
                            </div>

                            <div class="row justify-center items-center row-info-top" style="width: 59px">
                                {{ item.desc.perc }}
                            </div>
                            <div class="row-info-top" style="width: 1px">
                            </div>
                        </div>

                        <div class="row" style="font-size: 10px" :style="{ 'width': (380 - 40*(+item.inGroup)) + 'px' }">
                            <div class="row justify-center items-center row-info-bottom" style="width: 30px">
                                {{ item.num }}
                            </div>
                            <div class="col row">
                                <div class="row justify-center items-center row-info-bottom time-info" style="width: 50%">
                                    Загружен: {{ item.loadTime }}
                                </div>
                                <div class="row justify-center items-center row-info-bottom time-info" style="width: 50%">
                                    Читался: {{ item.touchTime }}
                                </div>
                            </div>
                            <div class="row-info-bottom" style="width: 1px">
                            </div>
                        </div>
                    </div>

                    <div
                        class="row-part column"
                        style="width: 90px;"
                    >
                        <div
                            class="col column justify-center" 
                            style="font-size: 75%; padding-left: 6px; border: 1px solid #cccccc; border-left: 0;"
                        >
                            <div :style="`margin-top: ${(archive ? 20 : 0)}px`">
                                <a v-show="isUrl(item.url)" :href="item.url" target="_blank">Оригинал</a><br><br>
                                <a :href="item.path" @click.prevent="downloadBook(item.path, item.fullTitle)">Скачать FB2</a>
                            </div>
                        </div>

                        <div
                            class="del-button self-end row justify-center items-center clickable"
                            @click="handleDel(item.key)"
                        >
                            <q-icon class="la la-times" size="12px" />
                            <q-tooltip :delay="1500" anchor="bottom middle" content-style="font-size: 80%">
                                {{ (archive ? 'Удалить окончательно' : 'Перенести в архив') }}
                            </q-tooltip>
                        </div>

                        <div
                            v-show="archive"
                            class="restore-button self-start row justify-center items-center clickable"
                            @click="handleRestore(item.key)"
                        >
                            <q-icon class="la la-arrow-left" size="14px" />
                            <q-tooltip :delay="1500" anchor="bottom middle" content-style="font-size: 80%">
                                Восстановить из архива
                            </q-tooltip>
                        </div>
                    </div>
                </div>
            </q-virtual-scroll>
        </div>
    </Window>
</template>

<script>
//-----------------------------------------------------------------------------
import vueComponent from '../../vueComponent.js';

import path from 'path-browserify';
import _ from 'lodash';

import * as utils from '../../../share/utils';
import LockQueue from '../../../share/LockQueue';
import Window from '../../share/Window.vue';
import bookManager from '../share/bookManager';
import readerApi from '../../../api/reader';
import coversStorage from '../share/coversStorage';

const componentOptions = {
    components: {
        Window,
    },
    watch: {
        search() {
            this.updateTableData();
        },
        sortMethod() {
            this.updateTableData();
        },
        settings() {
            this.loadSettings();
        },
    },
};
class RecentBooksPage {
    _options = componentOptions;

    loading = false;
    search = '';
    tableData = [];
    sortMethod = '';
    showSameBook = false;
    archive = false;

    covers = {};

    created() {
        this.commit = this.$store.commit;

        this.lastScrollTop1 = 0;
        this.lastScrollTop2 = 0;

        this.lock = new LockQueue(100);

        this.loadSettings();
    }

    init() {
        this.$refs.window.init();

        this.$nextTick(() => {
            //this.$refs.input.focus();//плохо на планшетах
        });

        this.inited = true;

        (async() => {
            this.showBar();
            await this.updateTableData();
            await this.scrollToActiveBook();
            //await this.scrollRefresh();
        })();
    }

    loadSettings() {
        const settings = this.settings;
        this.showSameBook = settings.recentShowSameBook;
        this.sortMethod = settings.recentSortMethod || 'loadTimeDesc';
    }

    get settings() {
        return this.$store.state.reader.settings;
    }

    async updateTableData() {
        if (!this.inited)
            return;

        await this.lock.get();
        try {
            let result = [];

            const sorted = bookManager.getSortedRecent();
            const activeBook = bookManager.mostRecentBook();

            //подготовка полей
            for (const book of sorted) {
                if ((!this.archive && book.deleted) || (this.archive && book.deleted != 1))
                    continue;

                let d = new Date();
                d.setTime(book.touchTime);
                const touchTime = utils.formatDate(d);
                const loadTimeRaw = (book.loadTime ? book.loadTime : 0);//book.addTime);
                d.setTime(loadTimeRaw);
                const loadTime = utils.formatDate(d);

                let readPart = 0;
                let perc = '';
                let textLen = '';
                const p = (book.bookPosSeen ? book.bookPosSeen : (book.bookPos ? book.bookPos : 0));
                if (book.textLength) {
                    readPart = p/book.textLength;
                    perc = `${(readPart*100).toFixed(2)}%`;
                    textLen = `${Math.floor(readPart*book.textLength/1000)}/${Math.floor(book.textLength/1000)}`;
                }

                const bt = utils.getBookTitle(book.fb2);

                let title = bt.bookTitle;
                title = (title ? `"${title}"`: '');
                const author = (bt.author ? bt.author : (bt.bookTitle ? bt.bookTitle : (book.uploadFileName ? book.uploadFileName : book.url)));

                result.push({
                    key: book.key,
                    url: book.url,
                    path: book.path,
                    deleted: book.deleted,

                    touchTime,
                    loadTime,
                    desc: {
                        author,
                        title,
                        perc,
                        textLen,
                    },
                    readPart,
                    fullTitle: bt.fullTitle,
                    sameBookKey: book.sameBookKey,
                    active: (activeBook.key == book.key),
                    activeParent: false,
                    inGroup: false,
                    coverPageUrl: book.coverPageUrl,

                    //для сортировки
                    loadTimeRaw,
                    touchTimeRaw: book.touchTime,
                });
            }

            //нумерация
            result.sort((a, b) => b.loadTimeRaw - a.loadTimeRaw);
            let num = 0;
            for (let i = result.length - 1; i >= 0; i--) {
                num++;
                result[i].num = num;
            }

            //фильтрация
            const search = this.search;
            if (search) {
                result = result.filter(item => {
                    return !search ||
                        item.touchTime.includes(search) ||
                        item.loadTime.includes(search) ||
                        item.desc.title.toLowerCase().includes(search.toLowerCase()) ||
                        item.desc.author.toLowerCase().includes(search.toLowerCase())
                });
            }

            //сортировка
            switch (this.sortMethod) {
                case 'loadTimeDesc':
                    result.sort((a, b) => b.loadTimeRaw - a.loadTimeRaw);
                    break;
                case 'loadTimeAsc':
                    result.sort((a, b) => a.loadTimeRaw - b.loadTimeRaw);
                    break;
                case 'touchTimeDesc':
                    result.sort((a, b) => b.touchTimeRaw - a.touchTimeRaw);
                    break;
                case 'touchTimeAsc':
                    result.sort((a, b) => a.touchTimeRaw - b.touchTimeRaw);
                    break;
                case 'authorDesc':
                    result.sort((a, b) => b.desc.author.localeCompare(a.desc.author));
                    break;
                case 'authorAsc':
                    result.sort((a, b) => a.desc.author.localeCompare(b.desc.author));
                    break;
                case 'titleDesc':
                    result.sort((a, b) => b.desc.title.localeCompare(a.desc.title));
                    break;
                case 'titleAsc':
                    result.sort((a, b) => a.desc.title.localeCompare(b.desc.title));
                    break;
            }

            //группировка
            const groups = {};
            const parents = {};
            let newResult = [];
            for (const book of result) {
                if (book.sameBookKey !== undefined) {
                    if (!groups[book.sameBookKey]) {
                        groups[book.sameBookKey] = [];
                        parents[book.sameBookKey] = book;

                        book.group = groups[book.sameBookKey];
                        newResult.push(book);
                    } else {
                        book.inGroup = true;
                        if (book.active)
                            parents[book.sameBookKey].activeParent = true;

                        groups[book.sameBookKey].push(book);
                    }
                } else {
                    newResult.push(book);
                }
            }
            result = newResult;

            //showSameBook
            if (this.showSameBook) {
                newResult = [];
                for (const book of result) {
                    newResult.push(book);
                    if (book.group) {
                        for (const sameBook of book.group) {
                            newResult.push(sameBook);
                        }
                    }
                }

                result = newResult;
            }

            //другие стадии
            //.....

            this.tableData = result;
        } finally {
            this.lock.ret();
        }
    }

    resetSearch() {
        this.search = '';
        this.$refs.input.focus();
    }

    wordEnding(num, type = 0) {
        const endings = [
            ['ов', '', 'а', 'а', 'а', 'ов', 'ов', 'ов', 'ов', 'ов'],
            ['й', 'я', 'и', 'и', 'и', 'й', 'й', 'й', 'й', 'й'],
            ['о', '', 'о', 'о', 'о', 'о', 'о', 'о', 'о', 'о']
        ];
        const deci = num % 100;
        if (deci > 10 && deci < 20) {
            return endings[type][0];
        } else {
            return endings[type][num % 10];
        }
    }

    get header() {
        const len = (this.tableData ? this.tableData.length : 0);
        return `${(this.search ? `Найден${this.wordEnding(len, 2)}` : 'Всего')} ${len} файл${this.wordEnding(len)}${this.archive ? ' в архиве' : ''}`;
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
        if (!this.archive) {
            await bookManager.delRecentBook({key});
            this.$root.notify.info('Перенесено в архив');
        } else {
            if (await this.$root.stdDialog.confirm('Подтвердите удаление из архива:', ' ')) {
                await bookManager.delRecentBook({key}, 2);
                this.$root.notify.info('Удалено безвозвратно');
            }
        }
    }

    async handleRestore(key) {
        await bookManager.restoreRecentBook({key});
        this.$root.notify.info('Восстановлено из архива');
    }

    async loadBook(item) {
        //чтобы не обновлять лишний раз updateTableData
        this.inited = false;

        if (item.deleted)
            await this.handleRestore(item.key);

        this.$emit('load-book', {url: item.url, path: item.path});
        this.close();
    }

    isUrl(url) {
        if (url)
            return (url.indexOf('disk://') != 0);
        else
            return false;
    }

    showBar() {
        this.lastScrollTop1 = this.$refs.vsContainer.scrollTop;
        this.$refs.header.style.position = 'sticky';
        this.$refs.header.style.top = 0;
    }

    onScroll() {
        const curScrollTop = this.$refs.vsContainer.scrollTop;

        if (this.lockScroll) {
            this.lastScrollTop1 = curScrollTop;
            return;
        }

        if (curScrollTop - this.lastScrollTop1 > 100) {
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

    showSameBookClick() {
        this.showSameBook = !this.showSameBook;

        const newSettings = _.cloneDeep(this.settings);
        newSettings.recentShowSameBook = this.showSameBook;
        this.commit('reader/setSettings', newSettings);

        this.updateTableData();
    }

    sortMethodSelected() {
        const newSettings = _.cloneDeep(this.settings);
        newSettings.recentSortMethod = this.sortMethod;
        this.commit('reader/setSettings', newSettings);
    }

    async scrollToActiveBook() {
        await this.$nextTick();

        this.lockScroll = true;
        try {
            let activeIndex = -1;
            let activeParentIndex = -1;
            for (let i = 0; i < this.tableData.length; i++) {
                const book = this.tableData[i];
                if (book.active)
                    activeIndex = i;
                if (book.activeParent)
                    activeParentIndex = i;

                if (activeIndex >= 0 && activeParentIndex >= 0)
                    break;
            }

            const index = (activeIndex >= 0 ? activeIndex : activeParentIndex);
            if (index >= 0) {
                this.$refs.virtualScroll.scrollTo(index, 'center');
            }
        } finally {
            await utils.sleep(100);
            this.lockScroll = false;
        }
    }

    async scrollToBegin() {
        this.lockScroll = true;
        try {
            this.$refs.virtualScroll.scrollTo(0, 'center');
        } finally {
            await utils.sleep(100);
            this.lockScroll = false;
        }
    }

    async scrollToEnd() {
        this.lockScroll = true;
        try {
            this.$refs.virtualScroll.scrollTo(this.tableData.length, 'center');
        } finally {
            await utils.sleep(100);
            this.lockScroll = false;
        }
    }

    async scrollRefresh() {
        this.lockScroll = true;
        await utils.sleep(100);
        try {
            this.$refs.virtualScroll.refresh();
        } finally {
            await utils.sleep(100);
            this.lockScroll = false;
        }
    }

    get sortMethodOptions() {
        return [
            {label: '<span style="font-size: 150%">&uarr;</span> Время загрузки', value: 'loadTimeDesc'},
            {label: '<span style="font-size: 150%">&darr;</span> Время загрузки', value: 'loadTimeAsc'},
            {label: '<span style="font-size: 150%">&uarr;</span> Время чтения', value: 'touchTimeDesc'},
            {label: '<span style="font-size: 150%">&darr;</span> Время чтения', value: 'touchTimeAsc'},
            {label: '<span style="font-size: 150%">&uarr;</span> Автор', value: 'authorDesc'},
            {label: '<span style="font-size: 150%">&darr;</span> Автор', value: 'authorAsc'},
            {label: '<span style="font-size: 150%">&uarr;</span> Название', value: 'titleDesc'},
            {label: '<span style="font-size: 150%">&darr;</span> Название', value: 'titleAsc'},
        ];
    }

    archiveToggle() {
        this.archive = !this.archive;
        this.updateTableData();
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

    makeCoverHtml(data) {
        return `<img src="${data}" style="height: 100%; width: 100%; object-fit: contain" />`;
    }

    isLoadedCover(coverPageUrl) {
        if (!coverPageUrl)
            return false;

        let loadedCover = this.covers[coverPageUrl];
        if (!loadedCover) {
            (async() => {
                //сначала заглянем в storage
                let data = await coversStorage.getData(coverPageUrl);
                if (data) {
                   this.covers[coverPageUrl] = this.makeCoverHtml(data);
                } else {//иначе идем на сервер
                    try {
                        data = await readerApi.getUploadedFileBuf(coverPageUrl);
                        await coversStorage.setData(coverPageUrl, data);
                        this.covers[coverPageUrl] = this.makeCoverHtml(data);
                    } catch (e) {
                        console.error(e);
                    }
                }
            })();
        }

        return (loadedCover != undefined);
    }

    getCoverHtml(coverPageUrl) {
        if (coverPageUrl && this.covers[coverPageUrl])
            return this.covers[coverPageUrl];
        else
            return '';
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
    padding-left: 5px;
}

.table-row {
    min-height: 80px;
}

.row-part {
    padding: 4px 0px 4px 0px;
}

.clickable {
    cursor: pointer;
}

.break-word {
    overflow-wrap: break-word;
    word-wrap: break-word;
    white-space: normal;
}

.even {
    background-color: #f2f2f2;
}

.active-book {
    background-color: #b0f0b0 !important;
}

.active-parent-book {
    background-color: #ffbbbb !important;
}

.icon {
    transition: transform 0.2s;
}

.expanded-icon {
    transform: rotate(90deg);
}

.tool-button {
    min-width: 30px;
    width: 30px;
    min-height: 30px;
    height: 30px;
    margin: 10px 6px 0px 3px;
    background-color: white;
}

.row-info-bottom {
    line-height: 110%;
    border-left: 1px solid #cccccc;
    border-bottom: 1px solid #cccccc;
    height: 12px;
}

.row-info-top {
    line-height: 110%;
    border: 1px solid #cccccc;
    border-right: 0;
    height: 12px;
}

.time-info, .row-info-top {
    color: #888888;
}

.read-bar {
    height: 4px;
    background-color: #bbbbbb;
}

.del-button {
    width: 25px;
    height: 20px;
    position: absolute;
    border-left: 1px solid #cccccc;
    border-bottom: 1px solid #cccccc;
    border-radius: 0 0 0 10px;
    margin: 1px;
}

.del-button:hover {
    color: white;
    background-color: #FF3030;
}

.restore-button {
    width: 25px;
    height: 20px;
    position: absolute;
    border-right: 1px solid #cccccc;
    border-bottom: 1px solid #cccccc;
    border-radius: 0 0 10px 0;
    margin: 1px;
}

.restore-button:hover {
    color: white;
    background-color: #00bb00;
}

.header-button, .header-button-pressed {
    width: 80px;
    height: 30px;
    cursor: pointer;
    color: #555555;
}

.header-button:hover {
    color: white;
    background-color: #39902F;
}

.header-button-pressed {
    color: black;
    background-color: yellow;
}

.header-button-pressed:hover {
    color: black;
}
</style>
