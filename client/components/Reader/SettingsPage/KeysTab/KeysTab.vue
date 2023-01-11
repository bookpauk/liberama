<template>
    <div class="fit column">
        <div class="bg-menu-1 row">
            <q-tabs
                v-model="selectedTab"
                active-color="app"
                active-bg-color="app"
                indicator-color="bg-app"
                dense
                no-caps
                class="bg-menu-2 text-menu"
            >
                <q-tab name="mouse" label="Мышь/тачскрин" />
                <q-tab name="keyboard" label="Клавиатура" />
            </q-tabs>
        </div>

        <div class="q-mb-sm" />

        <div class="col sets-tab-panel">
            <div v-if="selectedTab == 'mouse'">
                <div class="sets-item row">
                    <div class="sets-label label"></div>
                    <div class="col row">
                        <q-checkbox v-model="form.clickControl" size="xs" label="Включить управление кликом" />
                    </div>
                </div>
            </div>

            <div v-if="selectedTab == 'keyboard'">
                <div class="sets-item row">
                    <UserHotKeys v-model="form.userHotKeys" />
                </div>
            </div>
        </div>
    </div>
</template>

<script>
//-----------------------------------------------------------------------------
import vueComponent from '../../../vueComponent.js';

import UserHotKeys from './UserHotKeys/UserHotKeys.vue';

const componentOptions = {
    components: {
        UserHotKeys,
    },
};
class KeysTab {
    _options = componentOptions;
    _props = {
        form: Object,
    };

    selectedTab = 'mouse';

    created() {
    }

    mounted() {
    }

    get mode() {
        return this.$store.state.config.mode;
    }
}

export default vueComponent(KeysTab);
//-----------------------------------------------------------------------------
</script>

<style scoped>
.label {
    width: 110px;
}

</style>
