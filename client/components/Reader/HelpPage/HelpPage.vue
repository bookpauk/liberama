<template>
    <div ref="main" class="main" @click="close">
        <div class="mainWindow" @click.stop>
            <Window @close="close">
                <template slot="header">
                    Справка
                </template>

                <el-tabs type="border-card" v-model="selectedTab">
                    <el-tab-pane class="tab" label="Общее">
                        <CommonHelpPage></CommonHelpPage>
                    </el-tab-pane>
                    <el-tab-pane label="Клавиатура">
                    </el-tab-pane>
                    <el-tab-pane label="Мышь/тачпад">
                    </el-tab-pane>
                    <el-tab-pane label="Помочь проекту">
                    </el-tab-pane>

                </el-tabs>
            </Window>
        </div>
    </div>
</template>

<script>
//-----------------------------------------------------------------------------
import Vue from 'vue';
import Component from 'vue-class-component';

import Window from '../../share/Window.vue';
import CommonHelpPage from './CommonHelpPage/CommonHelpPage.vue';

export default @Component({
    components: {
        Window,
        CommonHelpPage,
    },
})
class HelpPage extends Vue {
    selectedTab = null;

    close() {
        this.$emit('help-toggle');
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
    justify-content: center;
    align-items: center;
}

.mainWindow {
    width: 100%;
    height: 100%;
    display: flex;
}

.el-tabs {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.el-tab-pane {
    flex: 1;
    display: flex;
}
</style>
