<template>
    <div class="fit column">
        <q-tabs
            v-model="selectedTab"
            active-color="black"
            active-bg-color="white"
            indicator-color="white"
            dense
            no-caps
            class="no-mp bg-grey-4 text-grey-7"
        >
            <q-tab name="mode" label="Режим" />
            <q-tab name="color" label="Цвет" />
            <q-tab name="font" label="Шрифт" />
            <q-tab name="text" label="Текст" />
            <q-tab name="status" label="Строка статуса" />
        </q-tabs>

        <div class="q-mb-sm" />

        <div class="col sets-tab-panel">
            <Mode v-if="selectedTab == 'mode'" :form="form" />
            <Color v-if="selectedTab == 'color'" :form="form" />
            <Font v-if="selectedTab == 'font'" :form="form" />
            <Text v-if="selectedTab == 'text'" :form="form" />
            <Status v-if="selectedTab == 'status'" :form="form" />
        </div>
    </div>
</template>

<script>
//-----------------------------------------------------------------------------
import vueComponent from '../../../vueComponent.js';

import Mode from './Mode/Mode.vue';
import Color from './Color/Color.vue';
import Font from './Font/Font.vue';
import Text from './Text/Text.vue';
import Status from './Status/Status.vue';

const componentOptions = {
    components: {
        Mode,
        Color,
        Font,
        Text,
        Status,
    },
};
class ViewTab {
    _options = componentOptions;
    _props = {
        form: Object,
    };

    selectedTab = 'mode';

    created() {
    }

    mounted() {
    }

}

export default vueComponent(ViewTab);
//-----------------------------------------------------------------------------
</script>

<style scoped>
.label {
    width: 75px;
}

</style>
