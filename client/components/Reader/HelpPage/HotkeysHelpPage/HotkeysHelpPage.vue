<template>
    <div class="page">
        <div style="font-size: 120%">
            <div class="text-h6 text-bold">
                Доступны следующие клавиатурные команды:
            </div>
            <br>
        </div>
        <div class="q-mb-md" style="width: 550px">
            <div class="text-right text-italic" style="font-size: 80%">
                * Изменить сочетания клавиш можно в настройках
            </div>
            <UserHotKeys v-model="userHotKeys" readonly />
        </div>
    </div>
</template>

<script>
//-----------------------------------------------------------------------------
import vueComponent from '../../../vueComponent.js';

import UserHotKeys from '../../SettingsPage/KeysTab/UserHotKeys/UserHotKeys.vue';

const componentOptions = {
    components: {
        UserHotKeys,
    },
};
class HotkeysHelpPage {
    _options = componentOptions;

    created() {
    }

    get userHotKeys() {
        return this.$store.state.reader.settings.userHotKeys;
    }

    set userHotKeys(value) {
        //no setter
    }

}

export default vueComponent(HotkeysHelpPage);
//-----------------------------------------------------------------------------
</script>

<style scoped>
.page {
    padding: 15px;
    overflow-y: auto;
}
</style>
