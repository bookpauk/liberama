<template>
    <div></div>
</template>

<script>
//-----------------------------------------------------------------------------
import Vue from 'vue';
import Component from 'vue-class-component';

import bookManager from '../share/bookManager';
import readerApi from '../../../api/reader';

export default @Component({
})
class ServerStorage extends Vue {
    created() {
        this.commit = this.$store.commit;
    }

    async init() {
        /*const items = {
            '1': {rev: 1, data: 1},
        };
        console.log(await readerApi.storageSet(items));*/
    }

    get settings() {
        return this.$store.state.reader.settings;
    }

}
//-----------------------------------------------------------------------------
</script>
