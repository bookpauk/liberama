<template>
    <div class="page">
        <div style="font-size: 120%">
            <div class="text-h6 text-bold">Доступны следующие клавиатурные команды:</div>
            <br>
        </div>
        <div class="q-mb-md" style="width: 550px">
            <div class="text-right text-italic" style="font-size: 80%">* Изменить сочетания клавиш можно в настройках</div>
            <UserHotKeys v-model="userHotKeys" readonly/>
        </div>
    </div>
</template>

<script>
//-----------------------------------------------------------------------------
import Vue from 'vue';
import Component from 'vue-class-component';

import UserHotKeys from '../../SettingsPage/UserHotKeys/UserHotKeys.vue';

export default @Component({
    components: {
        UserHotKeys,
    },
})
class HotkeysHelpPage extends Vue {
    created() {
    }

    get userHotKeys() {
        return this.$store.state.reader.settings.userHotKeys;
    }

    set userHotKeys(value) {
        //no setter
    }

}
//-----------------------------------------------------------------------------
</script>

<style scoped>
.page {
    padding: 15px;
    overflow-y: auto;
}
</style>
