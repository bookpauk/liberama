<template>
    <Window ref="window" @close="close">
        <template slot="header">
            {{ header }}
        </template>

        <div v-show="ready" class="col column" style="min-width: 600px">
            <div class="row items-center q-px-sm" style="height: 50px">
                <q-select class="q-mr-sm" v-model="rootLink" :options="rootLinkOptions"
                    style="width: 230px"
                    dropdown-icon="la la-angle-down la-sm"
                    rounded outlined dense emit-value map-options display-value-sanitize options-sanitize
                >
                    <template v-slot:prepend>
                        <q-btn class="q-mr-xs" round dense color="blue" icon="la la-plus" size="12px"/>
                        <q-btn round dense color="blue" icon="la la-bars" size="12px"/>
                    </template>
                    <template v-slot:selected>
                        <div style="overflow: hidden; white-space: nowrap;">{{ removeProtocol(rootLink) }}</div>
                    </template>
                </q-select>
                <q-select class="q-mr-sm" v-model="selectedLink" :options="selectedLinkOptions" style="width: 50px"
                    dropdown-icon="la la-angle-down la-sm"
                    rounded outlined dense emit-value map-options hide-selected display-value-sanitize options-sanitize
                >
                </q-select>
                <q-input class="col q-mr-sm" ref="input" rounded outlined dense bg-color="white" v-model="bookUrl" placeholder="Скопируйте сюда URL книги" @focus="onInputFocus">
                    <template v-slot:prepend>
                        <q-btn class="q-mr-xs" round dense color="blue" icon="la la-home" @click="goToStartLink" size="12px">
                            <q-tooltip :delay="1500" anchor="bottom middle" content-style="font-size: 80%">Вернуться на стартовую страницу</q-tooltip>
                        </q-btn>
                        <q-btn round dense color="blue" icon="la la-angle-double-down" @click="openBookUrlInFrame" size="12px">
                            <q-tooltip :delay="1500" anchor="bottom middle" content-style="font-size: 80%">Загрузить URL во фрейм</q-tooltip>
                        </q-btn>
                    </template>
                </q-input>
                <q-btn rounded color="green-7" no-caps size="14px" @click="submitUrl">Открыть
                    <q-tooltip :delay="1500" anchor="bottom middle" content-style="font-size: 80%">Открыть в читалке</q-tooltip>
                </q-btn>
            </div>
            <div class="separator"></div>
            <iframe v-if="frameVisible" class="col fit" ref="frame" :src="frameSrc" sandbox="allow-same-origin" frameborder="0"></iframe>
        </div>
    </Window>
</template>

<script>
//-----------------------------------------------------------------------------
import Vue from 'vue';
import Component from 'vue-class-component';
import _ from 'lodash';

import Window from '../share/Window.vue';
import * as utils from '../../share/utils';
//import rstore from '../../store/modules/reader';

export default @Component({
    components: {
        Window
    },
    watch: {
        libs: function() {
            this.loadLibs();
        },
        rootLink: function() {
            this.updateSelectedLink();
            this.updateStartLink();
        },
        selectedLink: function() {
            this.updateStartLink();
        }
    }    
})
class ExternalLibs extends Vue {
    ready = false;
    frameVisible = false;
    startLink = '';
    rootLink = '';
    selectedLink = '';
    frameSrc = '';
    bookUrl = '';
    libs = {};

    created() {
        this.$root.addKeyHook(this.keyHook);
        //this.commit = this.$store.commit;
        //this.commit('reader/setLibs', rstore.libsDefaults);
    }

    mounted() {        
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

        //Проверка закрытия родительского окна
        (async() => {
            let i = 0;
            while(!this.opener && i < 10) {
                await utils.sleep(1000);
                i++;
            }
            if (i >= 10) {
                await this.$root.stdDialog.alert('Нет связи с читалкой. Окно будет закрыто', 'Ошибка');
                window.close();
            }

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
            this.goToStartLink();
        } else if (d.type == 'notify') {
            this.$root.notify.success(d.data);
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
        this.startLink = (libs.comment ? libs.comment + ' ': '') + this.removeProtocol(libs.startLink);
        this.rootLink = this.getOrigin(libs.startLink);
        this.updateSelectedLink();
    }

    get header() {
        let result = (this.ready ? 'Библиотека' : 'Загрузка...');
        if (this.ready && this.startLink) {
            result += ` | ${this.startLink}`;
        }
        this.$root.$emit('set-app-title', result);
        return result;
    }

    updateSelectedLink() {
        if (!this.ready)
            return;
        const index = this.getRootIndexByUrl(this.rootLink);
        if (index >= 0)
            this.selectedLink = this.libs.groups[index].s;
    }

    updateStartLink() {
        if (!this.ready)
            return;
        const index = this.getRootIndexByUrl(this.rootLink);
        if (index >= 0) {
            let libs = _.cloneDeep(this.libs);
            libs.groups[index].s = this.selectedLink;
            libs.startLink = this.selectedLink;
            libs.comment = this.getCommentByLink(libs.groups[index].list, this.selectedLink);
            this.frameSrc = this.selectedLink;
            this.commitLibs(libs);
        }
    }

    get rootLinkOptions() {
        let result = [];
        if (!this.ready)
            return result;

        this.libs.groups.forEach(group => {
            result.push({label: this.removeProtocol(group.r), value: group.r});
        });

        return result;
    }

    get selectedLinkOptions() {
        let result = [];
        if (!this.ready)
            return result;

        const index = this.getRootIndexByUrl(this.rootLink);
        if (index >= 0) {
            this.libs.groups[index].list.forEach(link => {
                result.push({label: (link.c ? link.c + ' ': '') + this.removeOrigin(link.l), value: link.l});
            });
        }

        return result;
    }

    openBookUrlInFrame() {
        if (this.bookUrl)
            this.frameSrc = this.addProtocol(this.bookUrl);
    }

    goToStartLink() {
        if (!this.ready)
            return;

        this.frameSrc = this.libs.startLink;
        this.frameVisible = false;
        this.$nextTick(() => {
            this.frameVisible = true;
        });
    }

    addProtocol(url) {
        if ((url.indexOf('http://') != 0) && (url.indexOf('https://') != 0))
            return 'http://' + url;
        return url;
    }

    removeProtocol(url) {
        return url.replace(/(^\w+:|^)\/\//, '');
    }

    getOrigin(url) {
        const parsed = new URL(url);
        return parsed.origin;
    }

    removeOrigin(url) {
        const parsed = new URL(url);
        const result = url.substring(parsed.origin.length);
        return (result ? result : '/');
    }

    getRootIndexByUrl(url) {
        if (!this.ready)
            return -1;
        const origin = this.getOrigin(url);
        const groups = this.libs.groups;
        for (let i = 0; i < groups.length; i++) {
            if (groups[i].r == origin)
                return i;
        }
        return -1;
    }

    getCommentByLink(list, link) {
        for (const item of list) {
            if (item.l == link)
                return item.c;
        }
        return '';
    }

    onInputFocus() {
        this.$refs.input.select();
    }

    submitUrl() {
        if (this.bookUrl) {
            this.sendMessage({type: 'submitUrl', data: {url: this.addProtocol(this.bookUrl), force: true}});
            this.bookUrl = '';
            if (this.libs.closeAfterSubmit)
                this.close();
        }
    }

    close() {
        this.sendMessage({type: 'close'});
    }

    keyHook() {
        //недостатки сторонних ui
        const input = this.$refs.input.$refs.input;
        if (document.activeElement === input && event.type == 'keydown' && event.code == 'Enter') {
            this.submitUrl();
            return true;
        }

        if (event.type == 'keydown' && (event.code == 'Escape')) {
            this.close();
        }
        return true;
    }

}
//-----------------------------------------------------------------------------
</script>

<style scoped>
.separator {
    height: 1px;
    background-color: #A0A0A0;
}
</style>
