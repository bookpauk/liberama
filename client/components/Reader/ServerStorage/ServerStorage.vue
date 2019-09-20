<template>
    <div></div>
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

        this.debouncedSaveRecent = _.debounce((itemKey) => {
            this.saveRecent(itemKey);
        }, 1000);

        this.debouncedNotifySuccess = _.debounce(() => {
            this.success('Данные синхронизированы с сервером');
        }, 1000);

        this.oldProfiles = {};
        this.oldSettings = {};
    }

    async init() {
        try {
            if (!this.serverStorageKey) {
                //генерируем новый ключ
                await this.generateNewServerStorageKey();
            } else {
                await this.serverStorageKeyChanged();
            }
            bookManager.addEventListener(this.bookManagerEvent);
        } finally {
            this.inited = true;
        }
    }

    async bookManagerEvent(eventName, itemKey) {
        if (!this.serverSyncEnabled)
            return;

        if (eventName == 'recent-changed') {            
            if (itemKey) {
                if (!this.recentDeltaInited) {
                    this.warning('Функции сохранения на сервер пока недоступны');
                    return;
                }

                if (!this.recentDelta)
                    this.recentDelta = {};

                this.recentDelta[itemKey] = _.cloneDeep(bookManager.recent[itemKey]);

                this.debouncedSaveRecent(itemKey);
            }
        }
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
            await this.loadRecent();
            if (force)
                await this.saveRecent();
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

    checkCurrentProfile() {
        if (!this.profiles[this.currentProfile]) {
            this.commit('reader/setCurrentProfile', '');
        }
    }

    success(message) {
        if (this.showServerStorageMessages)
            this.$notify.success({message});
    }

    warning(message) {
        if (this.showServerStorageMessages)
            this.$notify.warning({message});
    }

    error(message) {
        if (this.showServerStorageMessages)
            this.$notify.error({message});
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

    async initRecentDelta() {
        let recentDelta = null;
        try {
            recentDelta = await this.storageGet({recentDelta: {}});
        } catch(e) {
            this.error(`Ошибка соединения с сервером: ${e.message}`);
            return;
        }

        if (recentDelta.state == 'success') {
            recentDelta = recentDelta.items.recentDelta;

            if (recentDelta.rev == 0)
                recentDelta.data = {};

            this.recentDelta = recentDelta.data;
            this.recentDeltaInited = true;
        } else {
            this.warning(`Неверный ответ сервера: ${recentDelta.state}`);
        }
    }

    async loadRecent(doNotifySuccess = true) {
        if (!this.keyInited || !this.serverSyncEnabled)
            return;

        const oldRecentRev = bookManager.recentRev;
        const oldRecentDeltaRev = bookManager.recentDeltaRev;
        //проверим ревизию на сервере
        let revs = null;
        try {
            revs = await this.storageCheck({recent: {}, recentDelta: {}});
            if (revs.state == 'success' && revs.items.recent.rev == oldRecentRev &&
                revs.items.recentDelta.rev == oldRecentDeltaRev) {
                if (!this.recentDeltaInited)
                    await this.initRecentDelta();
                return;
            }
        } catch(e) {
            this.error(`Ошибка соединения с сервером: ${e.message}`);
            return;
        }

        let recent = null;
        try {
            if (revs.items.recent.rev != oldRecentRev) {
                recent = await this.storageGet({recent: {}, recentDelta: {}});
            } else {
                recent = await this.storageGet({recentDelta: {}});
                recent.items.recent = {data: _.cloneDeep(bookManager.recent), rev: oldRecentRev};
            }
        } catch(e) {
            this.error(`Ошибка соединения с сервером: ${e.message}`);
            return;
        }

        if (recent.state == 'success') {
            let recentDelta = recent.items.recentDelta;
            recent = recent.items.recent;

            if (recent.rev == 0)
                recent.data = {};

            let newRecent = {};
            if (recentDelta && recentDelta.data) {
                if (recentDelta.data.diff) {
                    newRecent = recent.data;
                    const key = recentDelta.data.diff.key;
                    if (newRecent[key])
                        newRecent[key] = utils.applyObjDiff(newRecent[key], recentDelta.data.diff);
                } else {
                    newRecent = Object.assign(recent.data, recentDelta.data);
                }
                this.recentDelta = recentDelta.data;
            } else {
                newRecent = recent.data;
                this.recentDelta = {};
            }

            this.recentDeltaInited = true;

            if (!bookManager.loaded) {
                this.warning('Ожидание загрузки списка книг перед синхронизацией');
                while (!bookManager.loaded) await utils.sleep(100);
            }
            await bookManager.setRecent(newRecent);
            await bookManager.setRecentRev(recent.rev);
            await bookManager.setRecentDeltaRev(recentDelta.rev);
        } else {
            this.warning(`Неверный ответ сервера: ${recent.state}`);
        }

        if (doNotifySuccess)
            this.debouncedNotifySuccess();
    }

    async saveRecent(itemKey, recurse) {
        if (!this.keyInited || !this.serverSyncEnabled || this.savingRecent)
            return;

        const bm = bookManager;

        //вычисление критерия сохранения целиком
        if (!this.sameKeyCount)
            this.sameKeyCount = 0;
        if (this.prevItemKey == itemKey) {
            this.sameKeyCount++;
        } else {
            this.sameKeyCount = 0;
        }

        const l = Object.keys(this.recentDelta).length - (1*(!!this.recentDelta.diff));
        this.makeDeltaDiff = (l == 1 && this.prevItemKey == itemKey ? this.makeDeltaDiff : false);
        const forceSaveRecent =  l > 10 || (this.sameKeyCount > 5 && (l > 1)) || (l == 1 && this.sameKeyCount > 10 && !this.makeDeltaDiff);

        this.sameKeyCount = (!forceSaveRecent ? this.sameKeyCount : 0);
        this.prevItemKey = itemKey;

        //дифф от дельты для уменьшения размера передаваемых данных в частном случае
        /*if (this.makeDeltaDiff) {
            this.recentDelta.diff = utils.getObjDiff(this.prevSavedItem, bm.recent[itemKey]);
            this.recentDelta.diff.key = itemKey;
            delete this.recentDelta[itemKey];
        } else if (this.recentDelta.diff) {
            const key = this.recentDelta.diff.key;
            if (!this.prevSavedItem && bm.recent[key])
                this.prevSavedItem = _.cloneDeep(bm.recent[key]);
            if (this.prevSavedItem) {
                this.recentDelta[key] = utils.applyObjDiff(this.prevSavedItem, this.recentDelta.diff);
            }
            delete this.recentDelta.diff;
        }*/

        //сохранение
        this.savingRecent = true;        
        try {
            if (forceSaveRecent) {//сохраняем recent целиком
                let result = {state: ''};

                try {
                    result = await this.storageSet({recent: {rev: bm.recentRev + 1, data: bm.recent}, recentDelta: {rev: bm.recentDeltaRev + 1, data: {}}});
                } catch(e) {
                    this.error(`Ошибка соединения с сервером (${e.message}). Данные не сохранены и могут быть перезаписаны.`);
                }

                if (result.state == 'reject') {
                    await this.loadRecent(false);
                    this.warning(`Последние изменения отменены. Данные синхронизированы с сервером.`);
                    if (!recurse) {
                        this.savingRecent = false;
                        this.recentDelta[itemKey] = _.cloneDeep(bm.recent[itemKey]);
                        this.saveRecent(itemKey, true);
                        return;
                    }
                } else if (result.state == 'success') {
                    this.makeDeltaDiff = true;
                    this.prevSavedItem = _.cloneDeep(bm.recent[itemKey]);

                    this.recentDelta = {};
                    await bm.setRecentRev(bm.recentRev + 1);
                    await bm.setRecentDeltaRev(bm.recentDeltaRev + 1);
                }
            } else {//сохраняем только дифф
                let result = {state: ''};

                try {
                    result = await this.storageSet({recentDelta: {rev: bm.recentDeltaRev + 1, data: this.recentDelta}});
                } catch(e) {
                    this.error(`Ошибка соединения с сервером (${e.message}). Данные не сохранены и могут быть перезаписаны.`);
                }

                if (result.state == 'reject') {
                    await this.loadRecent(false);
                    this.warning(`Последние изменения отменены. Данные синхронизированы с сервером.`);
                    if (!recurse) {
                        this.savingRecent = false;
                        this.recentDelta[itemKey] = _.cloneDeep(bm.recent[itemKey]);
                        this.saveRecent(itemKey, true);
                        return;
                    }
                } else if (result.state == 'success') {
                    await bm.setRecentDeltaRev(bm.recentDeltaRev + 1);
                }
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
