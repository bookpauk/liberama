<template>
    <Window ref="window" width="600px" height="95%" @close="close">
        <template slot="header">
            Настроить закладки
        </template>

    </Window>
</template>

<script>
//-----------------------------------------------------------------------------
import Vue from 'vue';
import Component from 'vue-class-component';
import Window from '../../share/Window.vue';

const BookmarkSettingsProps = Vue.extend({
    props: {
        libs: Object,
    }
});

export default @Component({
    components: {
        Window,
    },
    watch: {
        libs: function() {
        },
    }    
})
class BookmarkSettings extends BookmarkSettingsProps {
    created() {
    }

    mounted() {
    }

    init() {
        this.$refs.window.init();
    }

    close() {
        this.$emit('close');
    }

    keyHook(event) {
        if (event.type == 'keydown' && event.key == 'Escape') {
            this.close();
            return true;
        }
        return false;
    }

}
//-----------------------------------------------------------------------------
</script>

<style scoped>
</style>
