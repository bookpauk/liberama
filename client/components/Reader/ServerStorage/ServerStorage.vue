<template>
    <div></div>
</template>

<script>
//-----------------------------------------------------------------------------
import Vue from 'vue';
import Component from 'vue-class-component';
import {Buffer} from 'safe-buffer';
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
        //console.log(await this.storageSet({'id1': {rev: 1, data: {test: 123}}}));
        //console.log(await this.storageGet({'id1': {rev: 1, data: {test: 123}}}));
    }

    get settings() {
        return this.$store.state.reader.settings;
    }

    get serverStorageKey() {
        return this.$store.state.reader.serverStorageKey;
    }

    generateNewServerStorageKey() {
        const key = utils.toBase58(Buffer.from(utils.randomArray(32)));
        this.commit('reader/setServerStorageKey', key);
    }

    async storageCheck(items) {
        return await this.decodeStorageItems(await readerApi.storage({action: 'check', items}));
    }

    async storageGet(items) {
        return await this.decodeStorageItems(await readerApi.storage({action: 'get', items}));
    }

    async storageSet(items, force) {
        return await readerApi.storage(await this.encodeStorageItems({action: 'set', force, items}));
    }

    async encodeStorageItems(request) {
        if (!_.isObject(request.items))
            throw new Error('items is not an object');

        let result = Object.assign({}, request);
        let items = {};
        for (const id of Object.keys(request.items)) {
            const item = request.items[id];
            if (!_.isObject(item.data))
                throw new Error('encodeStorageItems: data is not an object');

            let encoded = Object.assign({}, item);

            const comp = utils.pako.deflate(JSON.stringify(item.data), {level: 1});
            let encrypted = null;
            try {
                encrypted = await cryptoUtils.aesEncrypt(comp, this.serverStorageKey);
            } catch(e) {
                throw new Error('encrypt failed');
            }
            encoded.data = '1' + utils.toBase64(Buffer.from(encrypted));
            items[id] = encoded;
        }

        result.items = items;
        return result;
    }

    async decodeStorageItems(response) {
        if (!_.isObject(response.items))
            throw new Error('items is not an object');

        let result = Object.assign({}, response);
        let items = {};
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
                } catch(e) {
                    throw new Error('decrypt failed');
                }
                decoded.data = JSON.parse(utils.pako.inflate(decrypted, {to: 'string'}));
            }
            items[id] = decoded;
        }

        result.items = items;
        return result;
    }
}
//-----------------------------------------------------------------------------
</script>
