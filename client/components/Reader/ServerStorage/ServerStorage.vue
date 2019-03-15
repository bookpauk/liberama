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
})
class ServerStorage extends Vue {
    created() {
        this.commit = this.$store.commit;
    }

    async init() {
        if (!this.serverStorageKey) {
            //генерируем новый ключ
            this.generateNewServerStorageKey();
        }
        this.hashedStorageKey = utils.toBase58(await cryptoUtils.sha256(this.serverStorageKey));
        
        //console.log(await this.storageSet({'id1': {rev: 1, data: {test: 123}}}));
        //console.log(await this.storageGet({'id1': {}}));
        //console.log(await this.storageCheck({'id1': {rev: 1, data: {test: 123}}}));
    }

    get settings() {
        return this.$store.state.reader.settings;
    }

    get serverStorageKey() {
        return this.$store.state.reader.serverStorageKey;
    }

    generateNewServerStorageKey() {
        const key = utils.toBase58(utils.randomArray(32));
        this.commit('reader/setServerStorageKey', key);
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
                    encrypted = await cryptoUtils.aesEncrypt(comp, this.serverStorageKey);
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
                        decrypted = await cryptoUtils.aesDecrypt(a, this.serverStorageKey);
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
