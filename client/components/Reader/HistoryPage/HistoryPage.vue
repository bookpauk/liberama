<template>
    <div ref="main" class="main">
        <Window>
            <template slot="header">
                Прочитаные книги:
            </template>

            <div class="list">
                Test
            </div>
        </Window>
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
class HistoryPage extends Vue {
    created() {
        this.commit = this.$store.commit;
        this.reader = this.$store.state.reader;
    }

}
//-----------------------------------------------------------------------------
</script>

<style scoped>
.main {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.list {
    flex: 1;
    background-color: #ffffff;
}

.list-item {
}
</style>