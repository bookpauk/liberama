<template>
    <div></div>
</template>

<script>
//-----------------------------------------------------------------------------
import Vue from 'vue';
import Component from 'vue-class-component';
import {Buffer} from 'safe-buffer';

import bookManager from '../share/bookManager';
import readerApi from '../../../api/reader';
import * as utils from '../../../share/utils';

export default @Component({
})
class ServerStorage extends Vue {
    created() {
        this.commit = this.$store.commit;
    }

    async init() {
    }

    get settings() {
        return this.$store.state.reader.settings;
    }

}
//-----------------------------------------------------------------------------
</script>
