<template>
    <div ref="main" class="main" @click="close">
        <div class="mainWindow" @click.stop>
            <Window @close="close">
                <template slot="header">
                    {{ header }}
                </template>
            </Window>
        </div>
    </div>
</template>

<script>
//-----------------------------------------------------------------------------
import Vue from 'vue';
import Component from 'vue-class-component';

import Window from '../../share/Window.vue';

export default @Component({
    components: {
        Window,
    },
})
class SearchPage extends Vue {
    header = null;

    created() {
        this.commit = this.$store.commit;
        this.reader = this.$store.state.reader;

    }

    close() {
        this.$emit('search-toggle');
    }

    keyHook(event) {
        if (event.type == 'keydown' && (event.code == 'Escape')) {
            this.close();
        }
        return true;
    }
}
//-----------------------------------------------------------------------------
</script>

<style scoped>
.main {
    position: absolute;
    width: 100%;
    height: 100%;
    z-index: 40;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
}

.mainWindow {
    width: 100%;
    max-width: 400px;
    height: 140px;
    display: flex;
}

</style>