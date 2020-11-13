<template>
    <Window width="600px" ref="window" @close="close">
        <template slot="header">
        </template>

    </Window>
</template>

<script>
//-----------------------------------------------------------------------------
import Vue from 'vue';
import Component from 'vue-class-component';
//import _ from 'lodash';

import Window from '../../share/Window.vue';
//import * as utils from '../../../share/utils';

export default @Component({
    components: {
        Window,
    },
    watch: {
    },
})
class ContentsPage extends Vue {
    created() {
    }

    init() {
        this.$refs.window.init();
    }

    close() {
        this.$emit('do-action', {action: 'contents'});
    }

    keyHook(event) {
        if (!this.$root.stdDialog.active && event.type == 'keydown' && event.key == 'Escape') {
            this.close();
        }
        return true;
    }
}
//-----------------------------------------------------------------------------
</script>

<style scoped>
</style>
