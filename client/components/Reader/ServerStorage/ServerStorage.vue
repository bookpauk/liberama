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

const maxSetTries = 5;

export default @Component({
    watch: {
        serverSyncEnabled: function() {
            this.serverSyncEnabledChanged();
        },
        serverStorageKey: function() {
            this.serverStorageKeyChanged();
        },
        settings: function() {
            this.debouncedSaveSettings();
        },
        profiles: function() {
            this.saveProfiles();
        },
        currentProfile: function() {
            this.currentProfileChanged();
        },
    },
})
class ServerStorage extends Vue {
    created() {
        this.commit = this.$store.commit;
        this.prevServerStorageKey = null;
        this.$root.$on('generateNewServerStorageKey', () => {this.generateNewServerStorageKey()});

        this.debouncedSaveSettings = _.debounce(() => {
            this.saveSettings();
        }, 500);

        this.oldProfiles = {};
        this.oldSettings = {};
    }

    async init() {
        if (!this.serverStorageKey) {
            //генерируем новый ключ
            await this.generateNewServerStorageKey();
        } else {
            await this.serverStorageKeyChanged();
        }
        await this.currentProfileChanged();
    }

    async serverSyncEnabledChanged() {
        if (this.serverSyncEnabled) {
            this.prevServerStorageKey = null;
            await this.serverStorageKeyChanged();
        }
    }

    async serverStorageKeyChanged() {
        if (this.prevServerStorageKey != this.serverStorageKey) {
            this.prevServerStorageKey = this.serverStorageKey;
            this.hashedStorageKey = utils.toBase58(cryptoUtils.sha256(this.serverStorageKey));

            await this.loadProfiles();
            this.checkCurrentProfile();
        }
    }

    async currentProfileChanged() {
        if (!this.currentProfile)
            return;

        await this.loadSettings();
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

    checkCurrentProfile() {
        if (!this.profiles[this.currentProfile]) {
            this.commit('reader/setCurrentProfile', '');
        }
    }

    notifySuccessIfNeeded(rev1, rev2) {
        if (rev1 != rev2)
            this.$notify.success({message: 'Данные синхронизированы с сервером'});
    }

    warning(message) {
        this.$notify.warning({message});
    }

    error(message) {
        this.$notify.error({message});
    }

    async loadSettings() {
        if (!this.serverSyncEnabled || !this.currentProfile)
            return;

        const setsId = `settings-${this.currentProfile}`;
        let sets = await this.storageGet({[setsId]: {}});

        if (sets.state == 'success') {
            const oldRev = this.settingsRev[setsId] || 0;
            sets = sets.items[setsId];

            if (sets.rev == 0)
                sets.data = {};

            this.oldSettings = sets.data;
            this.commit('reader/setSettings', sets.data);
            this.commit('reader/setSettingsRev', {[setsId]: sets.rev});

            this.notifySuccessIfNeeded(oldRev, sets.rev);
        } else {
            this.warning(`Неверный ответ сервера: ${sets.state}`);
        }
    }

    async saveSettings() {
        if (!this.serverSyncEnabled || !this.currentProfile || this.savingSettings)
            return;

        const diff = utils.getObjDiff(this.oldSettings, this.settings);
        if (utils.isEmptyObjDiff(diff))
            return;

        this.savingSettings = true;
        try {
            const setsId = `settings-${this.currentProfile}`;
            let result = {state: ''};
            let tries = 0;
            while (result.state != 'success' && tries < maxSetTries) {
                const oldRev = this.settingsRev[setsId] || 0;
                result = await this.storageSet({[setsId]: {rev: oldRev + 1, data: this.settings}});

                if (result.state == 'reject') {
                    await this.loadSettings();
                    const newSettings = utils.applyObjDiff(this.settings, diff);
                    this.commit('reader/setSettings', newSettings);
                }

                tries++;
            }

            if (tries >= maxSetTries) {
                this.commit('reader/setSettings', this.oldSettings);
                this.error('Не удалось отправить данные на сервер');
            } else {
                this.oldSettings = this.settings;
                this.commit('reader/setSettingsRev', {[setsId]: this.settingsRev[setsId] + 1});
            }
        } finally {
            this.savingSettings = false;
        }
    }

    async loadProfiles() {
        if (!this.serverSyncEnabled)
            return;

        let prof = await this.storageGet({'profiles': {}});

        if (prof.state == 'success') {
            const oldRev = this.profilesRev;
            prof = prof.items.profiles;

            if (prof.rev == 0)
                prof.data = {};

            this.oldProfiles = prof.data;
            this.commit('reader/setProfiles', prof.data);
            this.commit('reader/setProfilesRev', prof.rev);

            this.notifySuccessIfNeeded(oldRev, prof.rev);
        } else {
            this.warning(`Неверный ответ сервера: ${prof.state}`);
        }
    }

    async saveProfiles() {
        if (!this.serverSyncEnabled || this.savingProfiles)
            return;

        const diff = utils.getObjDiff(this.oldProfiles, this.profiles);
        if (utils.isEmptyObjDiff(diff))
            return;

        this.savingProfiles = true;
        try {
            let result = {state: ''};
            let tries = 0;
            while (result.state != 'success' && tries < maxSetTries) {
                result = await this.storageSet({'profiles': {rev: this.profilesRev + 1, data: this.profiles}});

                if (result.state == 'reject') {
                    await this.loadProfiles();
                    const newProfiles = utils.applyObjDiff(this.profiles, diff);
                    this.commit('reader/setProfiles', newProfiles);
                }

                tries++;
            }

            if (tries >= maxSetTries) {
                this.commit('reader/setProfiles', this.oldProfiles);
                this.checkCurrentProfile();
                this.error('Не удалось отправить данные на сервер');
            } else {
                this.oldProfiles = this.profiles;
                this.commit('reader/setProfilesRev', this.profilesRev + 1);        
            }
        } finally {
            this.savingProfiles = false;
        }
    }

    async generateNewServerStorageKey() {
        const key = utils.toBase58(utils.randomArray(32));
        this.commit('reader/setServerStorageKey', key);
        await this.serverStorageKeyChanged();
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
