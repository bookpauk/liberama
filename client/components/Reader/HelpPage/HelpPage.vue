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
                :options="buttons"
            />
            <div class="separator"></div>

            <keep-alive>
                <component :is="activePage" ref="page" class="col"></component>
            </keep-alive>
        </div>
    </Window>
</template>

<script>
//-----------------------------------------------------------------------------
import vueComponent from '../../vueComponent.js';

import Window from '../../share/Window.vue';
import CommonHelpPage from './CommonHelpPage/CommonHelpPage.vue';
import HotkeysHelpPage from './HotkeysHelpPage/HotkeysHelpPage.vue';
import MouseHelpPage from './MouseHelpPage/MouseHelpPage.vue';
import VersionHistoryPage from './VersionHistoryPage/VersionHistoryPage.vue';
import DonateHelpPage from './DonateHelpPage/DonateHelpPage.vue';

const pages = {
    'CommonHelpPage': CommonHelpPage,
    'HotkeysHelpPage': HotkeysHelpPage,
    'MouseHelpPage': MouseHelpPage,
    'VersionHistoryPage': VersionHistoryPage,
    'DonateHelpPage': DonateHelpPage,
};

const tabs = [
    ['CommonHelpPage', 'Общее'],
    ['MouseHelpPage', 'Мышь/тачскрин'],
    ['HotkeysHelpPage', 'Клавиатура'],
    ['VersionHistoryPage', 'История версий'],
    ['DonateHelpPage', 'Помочь проекту'],
];

const componentOptions = {
    components: Object.assign({ Window }, pages),
};
class HelpPage {
    _options = componentOptions;

    selectedTab = 'CommonHelpPage';

    close() {
        this.$emit('do-action', {action: 'help'});
    }

    get activePage() {
        if (pages[this.selectedTab])
            return pages[this.selectedTab];
        return null;
    }

    get buttons() {
        let result = [];
        for (const tab of tabs)
            result.push({label: tab[1], value: tab[0]});
        return result;
    }

    activateDonateHelpPage() {
        this.selectedTab = 'DonateHelpPage';
    }

    activateVersionHistoryHelpPage() {
        this.selectedTab = 'VersionHistoryPage';
    }

    keyHook(event) {
        if (event.type == 'keydown' && event.key == 'Escape') {
            this.close();
        }
        return true;
    }
}

export default vueComponent(HelpPage);
//-----------------------------------------------------------------------------
</script>

<style scoped>
.separator {
    height: 1px;
    background-color: #E0E0E0;
}
</style>
