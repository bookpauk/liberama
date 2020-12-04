<template>
    <div class="hidden"></div>
</template>

<script>
//-----------------------------------------------------------------------------
import Vue from 'vue';
import Component from 'vue-class-component';
import _ from 'lodash';

import bookManager from '../share/bookManager';
import readerApi from '../../../api/reader';
import * as utils from '../../../share/utils';
import * as cryptoUtils from '../../../share/cryptoUtils';

import localForage from 'localforage';
const ssCacheStore = localForage.createInstance({
    name: 'ssCacheStore'
});

export default @Component({
    watch: {
        serverSyncEnabled: function() {
            this.serverSyncEnabledChanged();
        },
        serverStorageKey: function() {
            this.serverStorageKeyChanged(true);
        },
        settings: function() {
            this.debouncedSaveSettings();
        },
        profiles: function() {
            this.saveProfiles();
        },
        currentProfile: function() {
            this.currentProfileChanged(true);
        },
        libs: function() {
            this.debouncedSaveLibs();
        },
    },
})
class ServerStorage extends Vue {
    created() {
        this.inited = false;
        this.keyInited = false;
        this.commit = this.$store.commit;
        this.prevServerStorageKey = null;
        this.$root.$on('generateNewServerStorageKey', () => {this.generateNewServerStorageKey()});

        this.debouncedSaveSettings = _.debounce(() => {
            this.saveSettings();
        }, 500);

        this.debouncedSaveLibs = _.debounce(() => {
            this.saveLibs();
        }, 500);

        this.debouncedNotifySuccess = _.debounce(() => {
            this.success('Данные синхронизированы с сервером');
        }, 1000);

        this.oldProfiles = {};
        this.oldSettings = {};
        this.oldLibs = {};
    }

    async init() {
        try {
            this.cachedRecent = await ssCacheStore.getItem('recent');
            if (!this.cachedRecent)
                await this.cleanCachedRecent('cachedRecent');

            this.cachedRecentPatch = await ssCacheStore.getItem('recent-patch');
            if (!this.cachedRecentPatch)
                await this.cleanCachedRecent('cachedRecentPatch');

            this.cachedRecentMod = await ssCacheStore.getItem('recent-mod');
            if (!this.cachedRecentMod)
                await this.cleanCachedRecent('cachedRecentMod');

            if (!this.serverStorageKey) {
                //генерируем новый ключ
                await this.generateNewServerStorageKey();
            } else {
                await this.serverStorageKeyChanged();
            }
        } finally {
            this.inited = true;
        }
    }

    async setCachedRecent(value) {
        await ssCacheStore.setItem('recent', value);
        this.cachedRecent = value;
    }

    async setCachedRecentPatch(value) {
        await ssCacheStore.setItem('recent-patch', value);
        this.cachedRecentPatch = value;
    }

    async setCachedRecentMod(value) {
        await ssCacheStore.setItem('recent-mod', value);
        this.cachedRecentMod = value;
    }

    async cleanCachedRecent(whatToClean) {
        if (whatToClean == 'cachedRecent' || whatToClean == 'all')
            await this.setCachedRecent({rev: 0, data: {}});
        if (whatToClean == 'cachedRecentPatch' || whatToClean == 'all')
            await this.setCachedRecentPatch({rev: 0, data: {}});
        if (whatToClean == 'cachedRecentMod' || whatToClean == 'all')
            await this.setCachedRecentMod({rev: 0, data: {}});
    }

    async generateNewServerStorageKey() {
        const key = utils.toBase58(utils.randomArray(32));
        this.commit('reader/setServerStorageKey', key);
        await this.serverStorageKeyChanged(true);
    }

    async serverSyncEnabledChanged() {
        if (this.serverSyncEnabled) {
            this.prevServerStorageKey = null;
            if (!this.serverStorageKey) {
                //генерируем новый ключ
                await this.generateNewServerStorageKey();
            } else {
                await this.serverStorageKeyChanged(true);
            }
        }
    }

    async serverStorageKeyChanged(force) {
        if (this.prevServerStorageKey != this.serverStorageKey) {
            this.prevServerStorageKey = this.serverStorageKey;
            this.hashedStorageKey = utils.toBase58(cryptoUtils.sha256(this.serverStorageKey));
            this.keyInited = true;

            await this.loadProfiles(force);
            this.checkCurrentProfile();
            await this.currentProfileChanged(force);
            await this.loadLibs(force);

            if (force)
                await this.cleanCachedRecent('all');
            const loadSuccess = await this.loadRecent();
            if (loadSuccess && force) {
                await this.saveRecent();
            }
        }
    }

    async currentProfileChanged(force) {
        if (!this.currentProfile)
            return;

        await this.loadSettings(force);
    }

    get serverSyncEnabled() {
        return this.$store.state.reader.serverSyncEnabled;
    }

    get settings() {
        return this.$store.state.reader.settings;
    }

    get settingsRev() {
        return this.$store.state.reader.settingsRev;
    }

    get serverStorageKey() {
        return this.$store.state.reader.serverStorageKey;
    }

    get profiles() {
        return this.$store.state.reader.profiles;
    }

    get profilesRev() {
        return this.$store.state.reader.profilesRev;
    }

    get currentProfile() {
        return this.$store.state.reader.currentProfile;
    }

    get showServerStorageMessages() {
        return this.settings.showServerStorageMessages;
    }

    get libs() {
        return this.$store.state.reader.libs;
    }

    get libsRev() {
        return this.$store.state.reader.libsRev;
    }

    checkCurrentProfile() {
        if (!this.profiles[this.currentProfile]) {
            this.commit('reader/setCurrentProfile', '');
        }
    }

    success(message) {
        if (this.showServerStorageMessages)
            this.$root.notify.success(message);
    }

    warning(message) {
        if (this.showServerStorageMessages && !this.offlineModeActive)
            this.$root.notify.warning(message);
    }

    error(message) {
        if (this.showServerStorageMessages && !this.offlineModeActive) {
            this.errorMessageCounter = (this.errorMessageCounter ? this.errorMessageCounter + 1 : 1);
            const hint = (this.errorMessageCounter < 2 ? '' :
                '<div><br>Надоело это сообщение? Добавьте в настройках кнопку "Автономный режим" ' +
                '<i class="la la-unlink" style="font-size: 20px; color: white"></i> на панель инструментов и активируйте ее.</div>'
            );

            this.$root.notify.error(message + hint);
        }
    }

    async loadSettings(force = false, doNotifySuccess = true) {
        if (!this.keyInited || !this.serverSyncEnabled || !this.currentProfile)
            return;

        const setsId = `settings-${this.currentProfile}`;
        const oldRev = this.settingsRev[setsId] || 0;
        //проверим ревизию на сервере
        if (!force) {
            try {
                const revs = await this.storageCheck({[setsId]: {}});
                if (revs.state == 'success' && revs.items[setsId].rev == oldRev) {
                    return;
                }
            } catch(e) {
                this.error(`Ошибка соединения с сервером: ${e.message}`);
                return;
            }
        }

        let sets = null;
        try {
            sets = await this.storageGet({[setsId]: {}});
        } catch(e) {
            this.error(`Ошибка соединения с сервером: ${e.message}`);
            return;
        }

        if (sets.state == 'success') {
            sets = sets.items[setsId];

            if (sets.rev == 0)
                sets.data = {};

            this.oldSettings = _.cloneDeep(sets.data);
            this.commit('reader/setSettings', sets.data);
            this.commit('reader/setSettingsRev', {[setsId]: sets.rev});

            if (doNotifySuccess)
                this.debouncedNotifySuccess();
        } else {
            this.warning(`Неверный ответ сервера: ${sets.state}`);
        }
    }

    async saveSettings() {
        if (!this.keyInited || !this.serverSyncEnabled || !this.currentProfile || this.savingSettings)
            return;

        const diff = utils.getObjDiff(this.oldSettings, this.settings);
        if (utils.isEmptyObjDiff(diff))
            return;

        this.savingSettings = true;
        try {
            const setsId = `settings-${this.currentProfile}`;
            let result = {state: ''};

            const oldRev = this.settingsRev[setsId] || 0;
            try {
                result = await this.storageSet({[setsId]: {rev: oldRev + 1, data: this.settings}});
            } catch(e) {
                this.error(`Ошибка соединения с сервером (${e.message}). Данные не сохранены и могут быть перезаписаны.`);
            }

            if (result.state == 'reject') {
                await this.loadSettings(true, false);
                this.warning(`Последние изменения отменены. Данные синхронизированы с сервером.`);
            } else if (result.state == 'success') {
                this.oldSettings = _.cloneDeep(this.settings);
                this.commit('reader/setSettingsRev', {[setsId]: this.settingsRev[setsId] + 1});
            }
        } finally {
            this.savingSettings = false;
        }
    }

    async loadProfiles(force = false, doNotifySuccess = true) {
        if (!this.keyInited || !this.serverSyncEnabled)
            return;

        const oldRev = this.profilesRev;
        //проверим ревизию на сервере
        if (!force) {
            try {
                const revs = await this.storageCheck({profiles: {}});
                if (revs.state == 'success' && revs.items.profiles.rev == oldRev) {
                    return;
                }
            } catch(e) {
                this.error(`Ошибка соединения с сервером: ${e.message}`);
                return;
            }
        }

        let prof = null;
        try {
            prof = await this.storageGet({profiles: {}});
        } catch(e) {
            this.error(`Ошибка соединения с сервером: ${e.message}`);
            return;
        }

        if (prof.state == 'success') {
            prof = prof.items.profiles;

            if (prof.rev == 0)
                prof.data = {};

            this.oldProfiles = _.cloneDeep(prof.data);
            this.commit('reader/setProfiles', prof.data);
            this.commit('reader/setProfilesRev', prof.rev);
            this.checkCurrentProfile();

            if (doNotifySuccess)
                this.debouncedNotifySuccess();
        } else {
            this.warning(`Неверный ответ сервера: ${prof.state}`);
        }
    }

    async saveProfiles() {
        if (!this.keyInited || !this.serverSyncEnabled || this.savingProfiles)
            return;

        const diff = utils.getObjDiff(this.oldProfiles, this.profiles);
        if (utils.isEmptyObjDiff(diff))
            return;

        //обнуляются профили во время разработки при hotReload, подстраховка
        if (!this.$store.state.reader.allowProfilesSave) {
            console.error('Сохранение профилей не санкционировано');
            return;
        }

        this.savingProfiles = true;
        try {
            let result = {state: ''};
            try {
                result = await this.storageSet({profiles: {rev: this.profilesRev + 1, data: this.profiles}});
            } catch(e) {
                this.error(`Ошибка соединения с сервером (${e.message}). Данные не сохранены и могут быть перезаписаны.`);
            }

            if (result.state == 'reject') {
                await this.loadProfiles(true, false);
                this.warning(`Последние изменения отменены. Данные синхронизированы с сервером.`);
            } else if (result.state == 'success') {
                this.oldProfiles = _.cloneDeep(this.profiles);
                this.commit('reader/setProfilesRev', this.profilesRev + 1);
            }
        } finally {
            this.savingProfiles = false;
        }
    }

    async loadLibs(force = false, doNotifySuccess = true) {
        if (!this.keyInited || !this.serverSyncEnabled)
            return;

        const oldRev = this.libsRev;
        //проверим ревизию на сервере
        if (!force) {
            try {
                const revs = await this.storageCheck({libs: {}});
                if (revs.state == 'success' && revs.items.libs.rev == oldRev) {
                    return;
                }
            } catch(e) {
                this.error(`Ошибка соединения с сервером: ${e.message}`);
                return;
            }
        }

        let libs = null;
        try {
            libs = await this.storageGet({libs: {}});
        } catch(e) {
            this.error(`Ошибка соединения с сервером: ${e.message}`);
            return;
        }

        if (libs.state == 'success') {
            libs = libs.items.libs;

            if (libs.rev == 0)
                libs.data = {};

            this.oldLibs = _.cloneDeep(libs.data);
            this.commit('reader/setLibs', libs.data);
            this.commit('reader/setLibsRev', libs.rev);

            if (doNotifySuccess)
                this.debouncedNotifySuccess();
        } else {
            this.warning(`Неверный ответ сервера: ${libs.state}`);
        }
    }

    async saveLibs() {
        if (!this.keyInited || !this.serverSyncEnabled || this.savingLibs)
            return;

        const diff = utils.getObjDiff(this.oldLibs, this.libs);
        if (utils.isEmptyObjDiff(diff))
            return;

        this.savingLibs = true;
        try {
            let result = {state: ''};
            try {
                result = await this.storageSet({libs: {rev: this.libsRev + 1, data: this.libs}});
            } catch(e) {
                this.error(`Ошибка соединения с сервером (${e.message}). Данные не сохранены и могут быть перезаписаны.`);
            }

            if (result.state == 'reject') {
                await this.loadLibs(true, false);
                this.warning(`Последние изменения отменены. Данные синхронизированы с сервером.`);
            } else if (result.state == 'success') {
                this.oldLibs = _.cloneDeep(this.libs);
                this.commit('reader/setLibsRev', this.libsRev + 1);
            }
        } finally {
            this.savingLibs = false;
        }
    }

    async loadRecent(skipRevCheck = false, doNotifySuccess = true) {
        if (!this.keyInited || !this.serverSyncEnabled || this.loadingRecent)
            return;
        this.loadingRecent = true;
        try {
            //проверим ревизию на сервере
            let query = {recent: {}, recentPatch: {}, recentMod: {}};
            let revs = null;
            if (!skipRevCheck) {
                try {
                    revs = await this.storageCheck(query);
                    if (revs.state == 'success') {
                        if (revs.items.recent.rev != this.cachedRecent.rev) {
                            //no changes
                        } else if (revs.items.recentPatch.rev != this.cachedRecentPatch.rev) {
                            query = {recentPatch: {}, recentMod: {}};
                        } else if (revs.items.recentMod.rev != this.cachedRecentMod.rev) {
                            query = {recentMod: {}};
                        } else
                            return true;
                    }
                } catch(e) {
                    this.error(`Ошибка соединения с сервером: ${e.message}`);
                    return;
                }
            }

            let recent = null;
            try {
                recent = await this.storageGet(query);
            } catch(e) {
                this.error(`Ошибка соединения с сервером: ${e.message}`);
                return;
            }

            if (recent.state == 'success') {
                let newRecent = recent.items.recent;
                let newRecentPatch = recent.items.recentPatch;
                let newRecentMod = recent.items.recentMod;

                if (!newRecent) {
                    newRecent = _.cloneDeep(this.cachedRecent);
                }
                if (!newRecentPatch) {
                    newRecentPatch = _.cloneDeep(this.cachedRecentPatch);
                }
                if (!newRecentMod) {
                    newRecentMod = _.cloneDeep(this.cachedRecentMod);
                }

                if (newRecent.rev == 0) newRecent.data = {};
                if (newRecentPatch.rev == 0) newRecentPatch.data = {};
                if (newRecentMod.rev == 0) newRecentMod.data = {};

                let result = Object.assign({}, newRecent.data, newRecentPatch.data);

                const md = newRecentMod.data;
                if (md.key && result[md.key])
                    result[md.key] = utils.applyObjDiff(result[md.key], md.mod, {isAddChanged: true});

                /*if (!bookManager.loaded) {
                    this.warning('Ожидание загрузки списка книг перед синхронизацией');
                    while (!bookManager.loaded) await utils.sleep(100);
                }*/

                if (newRecent.rev != this.cachedRecent.rev)
                    await this.setCachedRecent(newRecent);
                if (newRecentPatch.rev != this.cachedRecentPatch.rev)
                    await this.setCachedRecentPatch(newRecentPatch);
                if (newRecentMod.rev != this.cachedRecentMod.rev)
                    await this.setCachedRecentMod(newRecentMod);

                await bookManager.setRecent(result);
            } else {
                this.warning(`Неверный ответ сервера: ${recent.state}`);
                return;
            }

            if (doNotifySuccess)
                this.debouncedNotifySuccess();
        } finally {
            this.loadingRecent = false;
        }
        return true;
    }

    async saveRecent(itemKey, recurse) {
        while (!this.inited || this.savingRecent)
            await utils.sleep(100);

        if (!this.keyInited || !this.serverSyncEnabled || this.savingRecent)
            return;

        this.savingRecent = true;
        try {        
            const bm = bookManager;

            let needSaveRecent = false;
            let needSaveRecentPatch = false;
            let needSaveRecentMod = false;

            //newRecentMod
            let newRecentMod = {};
            if (itemKey && this.cachedRecentPatch.data[itemKey] && this.prevItemKey == itemKey) {
                newRecentMod = _.cloneDeep(this.cachedRecentMod);
                newRecentMod.rev++;

                newRecentMod.data.key = itemKey;
                newRecentMod.data.mod = utils.getObjDiff(this.cachedRecentPatch.data[itemKey], bm.recent[itemKey]);
                needSaveRecentMod = true;
            }
            this.prevItemKey = itemKey;

            //newRecentPatch
            let newRecentPatch = {};
            if (itemKey && !needSaveRecentMod) {
                newRecentPatch = _.cloneDeep(this.cachedRecentPatch);
                newRecentPatch.rev++;
                newRecentPatch.data[itemKey] = _.cloneDeep(bm.recent[itemKey]);

                let applyMod = this.cachedRecentMod.data;
                if (applyMod && applyMod.key && newRecentPatch.data[applyMod.key])
                    newRecentPatch.data[applyMod.key] = utils.applyObjDiff(newRecentPatch.data[applyMod.key], applyMod.mod, {isAddChanged: true});

                newRecentMod = {rev: this.cachedRecentMod.rev + 1, data: {}};
                needSaveRecentPatch = true;
                needSaveRecentMod = true;
            }

            //newRecent
            let newRecent = {};
            if (!itemKey || (needSaveRecentPatch && Object.keys(newRecentPatch.data).length > 10)) {
                //ждем весь bm.recent
                /*while (!bookManager.loaded)
                    await utils.sleep(100);*/

                newRecent = {rev: this.cachedRecent.rev + 1, data: _.cloneDeep(bm.recent)};
                newRecentPatch = {rev: this.cachedRecentPatch.rev + 1, data: {}};
                newRecentMod = {rev: this.cachedRecentMod.rev + 1, data: {}};
                needSaveRecent = true;
                needSaveRecentPatch = true;
                needSaveRecentMod = true;
            }

            //query
            let query = {};
            if (needSaveRecent) {
                query = {recent: newRecent, recentPatch: newRecentPatch, recentMod: newRecentMod};
            } else if (needSaveRecentPatch) {
                query = {recentPatch: newRecentPatch, recentMod: newRecentMod};
            } else {
                query = {recentMod: newRecentMod};
            }

            //сохранение
            let result = {state: ''};

            try {
                result = await this.storageSet(query);
            } catch(e) {
                this.error(`Ошибка соединения с сервером (${e.message}). Данные не сохранены и могут быть перезаписаны.`);
            }

            if (result.state == 'reject') {

                const res = await this.loadRecent(false, false);

                if (res)
                    this.warning(`Последние изменения отменены. Данные синхронизированы с сервером.`);
                if (!recurse && itemKey) {
                    this.savingRecent = false;
                    this.saveRecent(itemKey, true);
                    return;
                }
            } else if (result.state == 'success') {
                if (needSaveRecent && newRecent.rev)
                    await this.setCachedRecent(newRecent);
                if (needSaveRecentPatch && newRecentPatch.rev)
                    await this.setCachedRecentPatch(newRecentPatch);
                if (needSaveRecentMod && newRecentMod.rev)
                    await this.setCachedRecentMod(newRecentMod);
            }
        } finally {
            this.savingRecent = false;
        }
    }

    async storageCheck(items) {
        return await this.storageApi('check', items);
    }

    async storageGet(items) {
        return await this.storageApi('get', items);
    }

    async storageSet(items, force) {
        return await this.storageApi('set', items, force);
    }

    async storageApi(action, items, force) {
        const request = {action, items};
        if (force)
            request.force = true;
        const encodedRequest = await this.encodeStorageItems(request);
        return await this.decodeStorageItems(await readerApi.storage(encodedRequest));
    }

    async encodeStorageItems(request) {
        if (!this.hashedStorageKey)
            throw new Error('hashedStorageKey is empty');

        if (!_.isObject(request.items))
            throw new Error('items is not an object');

        let result = Object.assign({}, request);
        let items = {};
        for (const id of Object.keys(request.items)) {
            const item = request.items[id];
            if (request.action == 'set' && !_.isObject(item.data))
                throw new Error('encodeStorageItems: data is not an object');

            let encoded = Object.assign({}, item);

            if (item.data) {
                const comp = utils.pako.deflate(JSON.stringify(item.data), {level: 1});
                let encrypted = null;
                try {
                    encrypted = cryptoUtils.aesEncrypt(comp, this.serverStorageKey);
                } catch (e) {
                    throw new Error('encrypt failed');
                }
                encoded.data = '1' + utils.toBase64(encrypted);
            }
            items[`${this.hashedStorageKey}.${utils.toBase58(id)}`] = encoded;
        }

        result.items = items;
        return result;
    }

    async decodeStorageItems(response) {
        if (!this.hashedStorageKey)
            throw new Error('hashedStorageKey is empty');

        let result = Object.assign({}, response);
        let items = {};
        if (response.items) {
            if (!_.isObject(response.items))
                throw new Error('items is not an object');

            for (const id of Object.keys(response.items)) {
                const item = response.items[id];
                let decoded = Object.assign({}, item);
                if (item.data) {
                    if (!_.isString(item.data) || !item.data.length)
                        throw new Error('decodeStorageItems: data is not a string');
                    if (item.data[0] !== '1')
                        throw new Error('decodeStorageItems: unknown data format');

                    const a = utils.fromBase64(item.data.substr(1));
                    let decrypted = null;
                    try {
                        decrypted = cryptoUtils.aesDecrypt(a, this.serverStorageKey);
                    } catch (e) {
                        throw new Error('decrypt failed');
                    }
                    decoded.data = JSON.parse(utils.pako.inflate(decrypted, {to: 'string'}));
                }

                const ids = id.split('.');
                if (!(ids.length == 2) || !(ids[0] == this.hashedStorageKey))
                    throw new Error(`decodeStorageItems: bad id - ${id}`);
                items[utils.fromBase58(ids[1])] = decoded;
            }
        }

        result.items = items;
        return result;
    }
}
//-----------------------------------------------------------------------------
</script>
