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
        return this.decodeStorageItems(await readerApi.storage({action: 'check', items}));
    }

    async storageGet(items) {
        return this.decodeStorageItems(await readerApi.storage({action: 'get', items}));
    }

    async storageSet(items, force) {
        return await readerApi.storage(this.encodeStorageItems({action: 'set', force, items}));
    }

    encodeStorageItems(request) {
        let result = Object.assign({}, request);
        let items = [];
        for (const item of request.items) {
            if (!_.isObject(item.data))
                throw new Error('encodeStorageItems: data is not an object');

            let encoded = Object.assign({}, item);

            const comp = utils.pako.deflate(JSON.stringify(item.data), {level: 1});
            encoded.data = utils.toBase64(Buffer.from(comp));
            items.push(encoded);
        }

        result.items = items;
        return result;
    }

    decodeStorageItems(response) {
        let result = Object.assign({}, response);
        let items = [];
        for (const item of response.items) {
            let decoded = Object.assign({}, item);
            if (item.data) {
                if (!_.isString(item.data))
                    throw new Error('decodeStorageItems: data is not a string');
                
                const a = utils.fromBase64(item.data);
                decoded.data = JSON.parse(utils.pako.inflate(a, {to: 'string'}));
            }
            items.push(decoded);
        }

        result.items = items;
        return result;
    }
}
//-----------------------------------------------------------------------------
</script>
