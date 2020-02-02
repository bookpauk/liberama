<template>
    <Window @close="close">
        <template slot="header">
            Справка
        </template>

        <div class="col column" style="min-width: 600px">
            <q-btn-toggle
                v-model="selectedTab"
                toggle-color="primary"
                no-caps unelevated
                :options="[
                    {label: 'Общее', value: 'common'},
                    {label: 'Клавиатура', value: 'hotkeys'},
                    {label: 'Мышь/тачскрин', value: 'mouse'},
                    {label: 'История версий', value: 'releases'},
                    {label: 'Помочь проекту', value: 'donate'}
                ]"
            />
            <div class="separator"></div>

            <CommonHelpPage v-if="selectedTab == 'common'" class="col"></CommonHelpPage>
            <HotkeysHelpPage v-if="selectedTab == 'hotkeys'" class="col"></HotkeysHelpPage>
            <MouseHelpPage v-if="selectedTab == 'mouse'" class="col"></MouseHelpPage>
            <VersionHistoryPage v-if="selectedTab == 'releases'" class="col"></VersionHistoryPage>
            <DonateHelpPage v-if="selectedTab == 'donate'" class="col"></DonateHelpPage>
        </div>
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
    selectedTab = 'common';

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
.separator {
    height: 1px;
    background-color: #E0E0E0;
}
</style>
