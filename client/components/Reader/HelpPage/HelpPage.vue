<template>
    <Window @close="close">
        <template slot="header">
            Справка
        </template>

        <el-tabs type="border-card" v-model="selectedTab">
            <el-tab-pane class="tab" label="Общее">
                <CommonHelpPage></CommonHelpPage>
            </el-tab-pane>
            <el-tab-pane label="Клавиатура">
                <HotkeysHelpPage></HotkeysHelpPage>
            </el-tab-pane>
            <el-tab-pane label="Мышь/тачскрин">
                <MouseHelpPage></MouseHelpPage>
            </el-tab-pane>
            <el-tab-pane label="История версий" name="releases">
                <VersionHistoryPage></VersionHistoryPage>
            </el-tab-pane>
            <el-tab-pane label="Помочь проекту" name="donate">
                <DonateHelpPage></DonateHelpPage>
            </el-tab-pane>
        </el-tabs>
    </Window>
</template>

<script>
//-----------------------------------------------------------------------------
import Vue from 'vue';
import Component from 'vue-class-component';

import Window from '../../share/Window.vue';
import CommonHelpPage from './CommonHelpPage/CommonHelpPage.vue';
import HotkeysHelpPage from './HotkeysHelpPage/HotkeysHelpPage.vue';
import MouseHelpPage from './MouseHelpPage/MouseHelpPage.vue';
import DonateHelpPage from './DonateHelpPage/DonateHelpPage.vue';
import VersionHistoryPage from './VersionHistoryPage/VersionHistoryPage.vue';

export default @Component({
    components: {
        Window,
        CommonHelpPage,
        HotkeysHelpPage,
        MouseHelpPage,
        DonateHelpPage,
        VersionHistoryPage,
    },
})
class HelpPage extends Vue {
    selectedTab = null;

    close() {
        this.$emit('help-toggle');
    }

    activateDonateHelpPage() {
        this.selectedTab = 'donate';
    }

    activateVersionHistoryHelpPage() {
        this.selectedTab = 'releases';
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
.el-tabs {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.el-tab-pane {
    flex: 1;
    display: flex;
    overflow: hidden;
}
</style>
