<template>
    <Window ref="window" @close="close" margin="2px">
        <template slot="header">
            {{ header }}
        </template>

        <template slot="buttons">
            <span class="full-screen-button row justify-center items-center" @mousedown.stop @click="fullScreenToggle">
                <q-icon :name="(fullScreenActive ? 'la la-compress-arrows-alt': 'la la-expand-arrows-alt')" size="16px"/>
                <q-tooltip :delay="1500" anchor="bottom middle" content-style="font-size: 80%">На весь экран</q-tooltip>
            </span>
        </template>

        <div v-show="ready" class="col column" style="min-width: 600px">
            <div class="row items-center q-px-sm" style="height: 50px">
                <q-select class="q-mr-sm" ref="rootLink" v-model="rootLink" :options="rootLinkOptions" @input="rootLinkInput"
                    @popup-show="onSelectPopupShow" @popup-hide="onSelectPopupHide"
                    style="width: 230px"
                    dropdown-icon="la la-angle-down la-sm"
                    rounded outlined dense emit-value map-options display-value-sanitize options-sanitize
                >
                    <template v-slot:prepend>
                        <q-btn class="q-mr-xs" round dense color="blue" icon="la la-plus" @click.stop="addBookmark" size="12px">
                            <q-tooltip :delay="1500" anchor="bottom middle" content-style="font-size: 80%">Добавить закладку</q-tooltip>
                        </q-btn>
                        <q-btn round dense color="blue" icon="la la-bars" @click.stop="bookmarkSettings" size="12px">
                            <q-tooltip :delay="1500" anchor="bottom middle" content-style="font-size: 80%">Настроить закладки</q-tooltip>
                        </q-btn>
                    </template>
                    <template v-slot:selected>
                        <div style="overflow: hidden; white-space: nowrap;">{{ rootLinkWithoutProtocol }}</div>
                    </template>
                </q-select>

                <q-select class="q-mr-sm" ref="selectedLink" v-model="selectedLink" :options="selectedLinkOptions" @input="selectedLinkInput" style="width: 50px"
                    @popup-show="onSelectPopupShow" @popup-hide="onSelectPopupHide"
                    dropdown-icon="la la-angle-down la-sm"
                    rounded outlined dense emit-value map-options hide-selected display-value-sanitize options-sanitize
                >
                    <q-tooltip :delay="1500" anchor="bottom middle" content-style="font-size: 80%">Закладки</q-tooltip>
                </q-select>

                <q-input class="col q-mr-sm" ref="input" rounded outlined dense bg-color="white" v-model="bookUrl" placeholder="Скопируйте сюда URL книги"
                    @focus="selectAllOnFocus" @keydown="bookUrlKeyDown"
                >
                    <template v-slot:prepend>
                        <q-btn class="q-mr-xs" round dense color="blue" icon="la la-home" @click="goToLink(selectedLink, true)" size="12px">
                            <q-tooltip :delay="1500" anchor="bottom middle" content-style="font-size: 80%">Вернуться на стартовую страницу</q-tooltip>
                        </q-btn>
                        <q-btn round dense color="blue" icon="la la-angle-double-down" @click="openBookUrlInFrame" size="12px" :disabled="!bookUrl">
                            <q-tooltip :delay="1500" anchor="bottom middle" content-style="font-size: 80%">Загрузить URL во фрейм</q-tooltip>
                        </q-btn>
                    </template>
                    <template v-slot:append>
                        <q-btn round dense color="blue" icon="la la-cog" @click.stop="openOptions" size="12px">
                            <q-tooltip :delay="1500" anchor="bottom middle" content-style="font-size: 80%">Опции</q-tooltip>
                        </q-btn>
                    </template>
                </q-input>

                <q-btn rounded color="green-7" no-caps size="14px" @click="submitUrl" :disabled="!bookUrl">Открыть
                    <q-tooltip :delay="1500" anchor="bottom middle" content-style="font-size: 80%">Открыть в читалке</q-tooltip>
                </q-btn>
            </div>
            <div class="separator"></div>

            <div class="col fit" style="position: relative;">
                <iframe v-if="frameVisible" class="fit" ref="frame" :src="frameSrc" frameborder="0"></iframe>
                <div v-show="transparentLayoutVisible" ref="transparentLayout" class="fit transparent-layout" @click="transparentLayoutClick"></div>
            </div>

            <Dialog ref="dialogAddBookmark" v-model="addBookmarkVisible">
                <template slot="header">
                    <div class="row items-center">
                        <q-icon class="q-mr-sm" name="la la-bookmark" size="28px"></q-icon>
                        <div v-if="addBookmarkMode == 'edit'">Редактировать закладку</div>
                        <div v-else>Добавить закладку</div>
                    </div>
                </template>

                <div class="q-mx-md row">
                    <q-input ref="bookmarkLink" class="col q-mr-sm" outlined dense bg-color="white" v-model="bookmarkLink" @keydown="bookmarkLinkKeyDown"
                        placeholder="Ссылка для закладки" maxlength="2000" @focus="selectAllOnFocus">
                    </q-input>

                    <q-select class="q-mr-sm" ref="defaultRootLink" v-model="defaultRootLink" :options="defaultRootLinkOptions" @input="defaultRootLinkInput" style="width: 50px"
                        dropdown-icon="la la-angle-down la-sm"
                        outlined dense emit-value map-options hide-selected display-value-sanitize options-sanitize
                    >
                        <q-tooltip :delay="1500" anchor="bottom middle" content-style="font-size: 80%">Предустановленные ссылки</q-tooltip>
                    </q-select>
                </div>

                <div class="q-mx-md q-mt-md">
                    <q-input class="col q-mr-sm" ref="bookmarkDesc" outlined dense bg-color="white" v-model="bookmarkDesc" @keydown="bookmarkDescKeyDown"
                        placeholder="Описание" style="width: 400px" maxlength="100" @focus="selectAllOnFocus">
                    </q-input>
                </div>

                <template slot="footer">
                    <q-btn class="q-px-md q-ml-sm" dense no-caps v-close-popup>Отмена</q-btn>
                    <q-btn class="q-px-md q-ml-sm" color="primary" dense no-caps @click="okAddBookmark" :disabled="!bookmarkLink">OK</q-btn>
                </template>
            </Dialog>
        </div>
        <BookmarkSettings v-if="bookmarkSettingsActive" ref="bookmarkSettings" :libs="libs" :addBookmarkVisible="addBookmarkVisible"
            @do-action="doAction" @close="closeBookmarkSettings">
        </BookmarkSettings>
    </Window>
</template>

<script>
//-----------------------------------------------------------------------------
import Vue from 'vue';
import Component from 'vue-class-component';
import _ from 'lodash';

import Window from '../share/Window.vue';
import Dialog from '../share/Dialog.vue';
import BookmarkSettings from './BookmarkSettings/BookmarkSettings.vue';

import rstore from '../../store/modules/reader';
import * as utils from '../../share/utils';
import * as lu from './linkUtils';

const proxySubst = {
    'http://flibusta.is': 'http://b.liberama.top:23480',
};

export default @Component({
    components: {
        Window,
        Dialog,
        BookmarkSettings
    },
    watch: {
        libs: function() {
            this.loadLibs();
        },
        defaultRootLink: function() {
            this.updateBookmarkLink();
        },
        bookUrl: function(newValue) {
            const value = lu.addProtocol(newValue);
            const subst = this.makeProxySubst(value, true);
            if (value != subst) {
                this.$nextTick(() => {
                    this.bookUrl = subst;
                });
            }
        },
        bookmarkLink: function(newValue) {
            const value = lu.addProtocol(newValue);
            const subst = this.makeProxySubst(value, true);
            if (value != subst) {
                this.$nextTick(() => {
                    this.bookmarkLink = subst;
                });
            }
        },
    }    
})
class ExternalLibs extends Vue {
    ready = false;
    frameVisible = false;
    rootLink = '';
    selectedLink = '';
    frameSrc = '';
    bookUrl = '';
    libs = {};
    fullScreenActive = false;
    addBookmarkVisible = false;
    transparentLayoutVisible = false;

    addBookmarkMode = '';
    bookmarkLink = '';
    bookmarkDesc = '';
    defaultRootLink = '';

    bookmarkSettingsActive = false;

    created() {
        this.$root.addKeyHook(this.keyHook);

        document.addEventListener('fullscreenchange', () => {
            this.fullScreenActive = (document.fullscreenElement !== null);
        });

        this.debouncedGoToLink = _.debounce((link, force) => {
            this.goToLink(link, force);
        }, 100, {'maxWait':200});
        //this.commit = this.$store.commit;
        //this.commit('reader/setLibs', rstore.libsDefaults);
    }

    mounted() {
        //Поправка метода toggleOption компонента select фреймворка quasar, необходимо другое поведение
        //$emit('input'.. вызывается всегда
        this.toggleOption = function(opt, keepOpen) {
            if (this.editable !== true || opt === void 0 || this.isOptionDisabled(opt) === true) {
                return;
            }

            const optValue = this.getOptionValue(opt);

            if (this.multiple !== true) {
                if (keepOpen !== true) {
                    this.updateInputValue(this.fillInput === true ? this.getOptionLabel(opt) : '', true, true);
                    this.hidePopup();
                }

                this.$refs.target !== void 0 && this.$refs.target.focus();
                this.$emit('input', this.emitValue === true ? optValue : opt);
            }
        };

        this.$refs.rootLink.toggleOption = this.toggleOption;
        this.$refs.selectedLink.toggleOption = this.toggleOption;

        (async() => {
            //подождем this.mode
            let i = 0;
            while(!this.mode && i < 100) {
                await utils.sleep(100);
                i++;
            }

            if (this.mode != 'liberama.top') {
                this.$router.replace('/404');
                return;
            }

            this.$refs.window.init();

            this.opener = null;
            const host = window.location.host;
            const openerHost = (host.indexOf('b.') == 0 ? host.substring(2) : host);
            const openerOrigin1 = `http://${openerHost}`;
            const openerOrigin2 = `https://${openerHost}`;

            window.addEventListener('message', (event) => {
                if (event.origin !== openerOrigin1 && event.origin !== openerOrigin2)
                    return;
                if (!_.isObject(event.data) || event.data.from != 'LibsPage')
                    return;
                if (event.origin == openerOrigin1)
                    this.opener = window.opener;
                else
                    this.opener = event.source;
                this.openerOrigin = event.origin;

                //console.log(event);

                this.recvMessage(event.data);
            });

            //Ожидаем родителя
            i = 0;
            while(!this.opener) {
                await utils.sleep(1000);
                i++;
                if (i >= 5) {
                    await this.$root.stdDialog.alert('Нет связи с читалкой. Окно будет закрыто', 'Ошибка');
                    window.close();
                }
            }

            //Проверка закрытия родительского окна
            while(this.opener) {
                await this.checkOpener();
                await utils.sleep(1000);
            }
        })();
    }

    recvMessage(d) {
        if (d.type == 'mes') {
            switch(d.data) {
                case 'hello': this.sendMessage({type: 'mes', data: 'ready'}); break;
            }
        } else if (d.type == 'libs') {
            this.ready = true;
            this.libs = _.cloneDeep(d.data);
        } else if (d.type == 'notify') {
            this.$root.notify.success(d.data, '', {position: 'bottom-right'});
        }
    }

    sendMessage(d) {
        (async() => {
            await this.checkOpener();
            if (this.opener && this.openerOrigin)
                this.opener.postMessage(Object.assign({}, {from: 'ExternalLibs'}, d), this.openerOrigin);
        })();
    }

    async checkOpener() {
        if (this.opener.closed) {
            await this.$root.stdDialog.alert('Потеряна связь с читалкой. Окно будет закрыто', 'Ошибка');
            window.close();
        }
    }

    commitLibs(libs) {
        this.sendMessage({type: 'libs', data: libs});
    }

    loadLibs() {
        const libs = this.libs;

        this.selectedLink = libs.startLink;

        this.updateStartLink();
    }

    doAction(event) {
        switch (event.action) {
            case 'setLibs': this.commitLibs(event.data); break;
            case 'setRootLink': this.rootLink = event.data; this.rootLinkInput(); break;
            case 'setSelectedLink': this.selectedLink = event.data; this.selectedLinkInput(); break;
            case 'editBookmark': this.addBookmark('edit', event.data.link, event.data.desc); break;
            case 'addBookmark': this.addBookmark('add'); break;
        }
    }

    get mode() {
        return this.$store.state.config.mode;
    }

    get header() {
        let result = (this.ready ? 'Библиотека' : 'Загрузка...');
        if (this.ready && this.selectedLink) {
            result += ` | ${(this.libs.comment ? this.libs.comment + ' ': '') + lu.removeProtocol(this.libs.startLink)}`;
        }
        this.$root.$emit('set-app-title', result);
        return result;
    }

    get rootLinkWithoutProtocol() {
        return lu.removeProtocol(this.rootLink);
    }

    updateSelectedLinkByRoot() {
        if (!this.ready)
            return;

        const index = lu.getSafeRootIndexByUrl(this.libs.groups, this.rootLink);
        if (index >= 0)
            this.selectedLink = this.libs.groups[index].s;
        else
            this.selectedLink = '';
    }

    updateStartLink(force) {
        if (!this.ready)
            return;

        let index = -1;
        try {
            this.rootLink = lu.getOrigin(this.selectedLink);
            index = lu.getRootIndexByUrl(this.libs.groups, this.rootLink);
        } catch(e) {
            //
        }

        if (index >= 0) {
            let libs = _.cloneDeep(this.libs);
            const com = this.getCommentByLink(libs.groups[index].list, this.selectedLink);
            if (libs.groups[index].s != this.selectedLink ||
                libs.startLink != this.selectedLink ||
                libs.comment != com) {
                libs.groups[index].s = this.selectedLink;
                libs.startLink = this.selectedLink;
                libs.comment = com;
                this.commitLibs(libs);
            }

            this.debouncedGoToLink(this.selectedLink, force);
        } else {
            this.rootLink = '';
            this.selectedLink = '';
            this.debouncedGoToLink(this.selectedLink, force);
        }
    }

    get rootLinkOptions() {
        let result = [];
        if (!this.ready)
            return result;

        this.libs.groups.forEach(group => {
            result.push({label: lu.removeProtocol(group.r), value: group.r});
        });

        return result;
    }

    get defaultRootLinkOptions() {
        let result = [];

        rstore.libsDefaults.groups.forEach(group => {
            result.push({label: lu.removeProtocol(group.r), value: group.r});
        });

        return result;
    }

    get selectedLinkOptions() {
        let result = [];
        if (!this.ready)
            return result;

        const index = lu.getSafeRootIndexByUrl(this.libs.groups, this.rootLink);
        if (index >= 0) {
            this.libs.groups[index].list.forEach(link => {
                result.push({label: (link.c ? link.c + ' ': '') + lu.removeOrigin(link.l), value: link.l});
            });
        }

        return result;
    }

    openBookUrlInFrame() {
        if (this.bookUrl) {
            this.goToLink(lu.addProtocol(this.bookUrl), true);
        }
    }

    goToLink(link, force) {
        if (!this.ready || !link)
            return;

        if (!link) {
            this.frameVisible = false;
            return;
        }

        const newLink = this.makeProxySubst(link);
        if (force || newLink != this.frameSrc) {
            this.frameSrc = newLink;

            this.frameVisible = false;
            this.$nextTick(() => {
                this.frameVisible = true;
                this.$nextTick(() => {
                    if (this.$refs.frame)
                        this.$refs.frame.contentWindow.focus();
                });
            });
        }
    }

    getCommentByLink(list, link) {
        const item = lu.getListItemByLink(list, link);
        return (item ? item.c : '');
    }

    makeProxySubst(url, reverse = false) {
        for (const [key, value] of Object.entries(proxySubst)) {
            if (reverse && value == url.substring(0, value.length)) {
                return key + url.substring(value.length);
            } else if (!reverse && key == url.substring(0, key.length)) {
                return value + url.substring(key.length);
            }
        }

        return url;
    }

    selectAllOnFocus(event) {
        if (event.target.select)
            event.target.select();
    }

    rootLinkInput() {
        this.updateSelectedLinkByRoot();
        this.updateStartLink(true);
    }

    selectedLinkInput() {
        this.updateStartLink(true);
    }

    submitUrl() {
        if (this.bookUrl) {
            this.sendMessage({type: 'submitUrl', data: {
                url: this.bookUrl,
                force: true
            }});
            this.bookUrl = '';
            if (this.libs.closeAfterSubmit)
                this.close();
        }
    }

    addBookmark(mode = 'add', link = '', desc = '') {

        if (mode == 'edit') {
            this.editBookmarkLink = this.bookmarkLink = link;
            this.editBookmarkDesc = this.bookmarkDesc = desc;
        } else {
            this.bookmarkLink = this.bookUrl;
            this.bookmarkDesc = '';
        }

        this.addBookmarkMode = mode;
        this.addBookmarkVisible = true;
        this.$nextTick(() => {
            this.$refs.bookmarkLink.focus();
            this.$refs.defaultRootLink.toggleOption = this.toggleOption;
        });
    }

    updateBookmarkLink() {
        const index = lu.getSafeRootIndexByUrl(rstore.libsDefaults.groups, this.defaultRootLink);
        if (index >= 0) {
            this.bookmarkLink = rstore.libsDefaults.groups[index].s;
            this.bookmarkDesc = this.getCommentByLink(rstore.libsDefaults.groups[index].list, this.bookmarkLink);
        } else {
            this.bookmarkLink = '';
            this.bookmarkDesc = '';
        }
    }

    defaultRootLinkInput() {
        this.updateBookmarkLink();
    }

    bookmarkLinkKeyDown(event) {
        if (event.key == 'Enter') {
            this.$refs.bookmarkDesc.focus();
            event.preventDefault();
        }
    }

    bookmarkDescKeyDown(event) {
        if (event.key == 'Enter') {
            event.stopPropagation();
            event.preventDefault();
            this.okAddBookmark();
        }
    }

    async okAddBookmark() {
        if (!this.bookmarkLink)
            return;

        const link = (this.addBookmarkMode == 'edit' ? lu.addProtocol(this.editBookmarkLink) : lu.addProtocol(this.bookmarkLink));
        let index = -1;
        try {
            index = lu.getRootIndexByUrl(this.libs.groups, link);
        } catch (e) {
            await this.$root.stdDialog.alert('Неверный формат ссылки', 'Ошибка');
            return;
        }

        let libs = _.cloneDeep(this.libs);

        //добавление
        //есть группа в закладках
        if (index >= 0) {
            const item = lu.getListItemByLink(libs.groups[index].list, link);

            //редактирование
            if (item && this.addBookmarkMode == 'edit') {
                if (item) {
                    //редактируем
                    item.l = link;
                    item.c = this.bookmarkDesc;
                    this.commitLibs(libs);
                } else {
                    await this.$root.stdDialog.alert('Не удалось отредактировать закладку', 'Ошибка');
                }
            } else if (!item) {
                //добавляем
                if (libs.groups[index].list.length >= 100) {
                    await this.$root.stdDialog.alert('Достигнут предел количества закладок для этого сайта', 'Ошибка');
                    return;
                }

                libs.groups[index].list.push({l: link, c: this.bookmarkDesc});
                this.commitLibs(libs);
            } else if (item.c != this.bookmarkDesc) {
                if (await this.$root.stdDialog.confirm(`Такая закладка уже существует с другим описанием.<br>` +
                    `Заменить '${this.$sanitize(item.c)}' на '${this.$sanitize(this.bookmarkDesc)}'?`, ' ')) {
                    item.c = this.bookmarkDesc;
                    this.commitLibs(libs);                    
                } else 
                    return;
            } else {
                await this.$root.stdDialog.alert('Такая закладка уже существует', ' ');
                return;
            }
        } else {//нет группы в закладках
            if (libs.groups.length >= 100) {
                await this.$root.stdDialog.alert('Достигнут предел количества различных сайтов в закладках', 'Ошибка');
                return;
            }

            //добавляем сначала группу
            libs.groups.push({r: lu.getOrigin(link), s: link, list: []});
            
            index = lu.getSafeRootIndexByUrl(libs.groups, link);
            if (index >= 0)
                libs.groups[index].list.push({l: link, c: this.bookmarkDesc});

            this.commitLibs(libs);
        }

        this.addBookmarkVisible = false;
    }

    fullScreenToggle() {
        this.fullScreenActive = !this.fullScreenActive;
        if (this.fullScreenActive) {
            this.$q.fullscreen.request();
        } else {
            this.$q.fullscreen.exit();
        }
    }

    transparentLayoutClick() {
        this.transparentLayoutVisible = false;
    }

    onSelectPopupShow() {
        this.transparentLayoutVisible = true;
    }

    onSelectPopupHide() {
        this.transparentLayoutVisible = false;
    }

    close() {
        this.sendMessage({type: 'close'});
    }

    bookUrlKeyDown(event) {
        if (event.key == 'Enter') {
            this.submitUrl();
            event.preventDefault();
        }
    }

    bookmarkSettings() {
        this.bookmarkSettingsActive = true;
        this.$nextTick(() => {
            this.$refs.bookmarkSettings.init();
        });
    }

    closeBookmarkSettings() {
        this.bookmarkSettingsActive = false;
    }

    openOptions() {
    }

    keyHook(event) {
        if (this.$root.rootRoute() == '/external-libs') {
            if (this.$root.stdDialog.active)
                return false;

            if (this.bookmarkSettingsActive && this.$refs.bookmarkSettings.keyHook(event))
                return true;

            if (this.addBookmarkVisible)
                return false;

            if (event.type == 'keydown' && event.key == 'F4') {
                this.addBookmark();
                return true;
            }

            if (event.type == 'keydown' && event.key == 'Escape' &&
                (document.activeElement != this.$refs.rootLink.$refs.target || !this.$refs.rootLink.menu) &&
                (document.activeElement != this.$refs.selectedLink.$refs.target || !this.$refs.selectedLink.menu)
               ) {
                this.close();
                return true;
            }
        }
        return false;
    }
}
//-----------------------------------------------------------------------------
</script>

<style scoped>
.separator {
    height: 1px;
    background-color: #A0A0A0;
}

.full-screen-button {
    width: 30px;
    height: 30px;
    cursor: pointer;
}

.full-screen-button:hover {
    background-color: #69C05F;
}

.transparent-layout {
    top: 0;
    left: 0;
    position: absolute;
}
</style>
