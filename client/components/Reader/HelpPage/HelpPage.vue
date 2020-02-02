<template>
    <Window @close="close">
        <template slot="header">
            Справка
        </template>

        <div class="col" style="min-width: 600px; display: grid">
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
            <q-separator />

            <q-tab-panels v-model="selectedTab">
                <q-tab-panel name="common">
                    <CommonHelpPage></CommonHelpPage>
                </q-tab-panel>

                <q-tab-panel name="hotkeys">
                    <HotkeysHelpPage></HotkeysHelpPage>
                </q-tab-panel>

                <q-tab-panel name="mouse">
                    <MouseHelpPage></MouseHelpPage>
                </q-tab-panel>

                <q-tab-panel name="releases">
                    <VersionHistoryPage></VersionHistoryPage>
                </q-tab-panel>

                <q-tab-panel name="donate">
                    <DonateHelpPage></DonateHelpPage>
                </q-tab-panel>
            </q-tab-panels>
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
</style>
