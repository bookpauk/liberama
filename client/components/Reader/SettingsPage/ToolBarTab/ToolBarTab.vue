<template>
    <div class="fit sets-tab-panel">
        <div class="sets-part-header">
            Отображение
        </div>

        <div class="item row no-wrap">
            <div class="sets-label label"></div>
            <q-checkbox v-model="form.toolBarHideOnScroll" size="xs" label="Скрывать/показывать панель при прокрутке">
                <q-tooltip :delay="1000" anchor="top middle" self="bottom middle" content-style="font-size: 80%">
                    Скрывать/показывть панель при прокрутке текста вперед/назад
                </q-tooltip>
            </q-checkbox>
        </div>

        <div class="sets-part-header">
            Показывать кнопки
        </div>

        <div v-for="item in rstore.toolButtons" :key="item.name">
            <div class="sets-item row no-wrap">
                <div class="sets-label label"></div>
                <q-checkbox v-model="form.showToolButton[item.name]" size="xs" :label="rstore.readerActions[item.name]" />
            </div>
        </div>
    </div>
</template>

<script>
//-----------------------------------------------------------------------------
import vueComponent from '../../../vueComponent.js';

import rstore from '../../../../store/modules/reader';

const componentOptions = {
    watch: {
    },
};
class ToolBarTab {
    _options = componentOptions;
    _props = {
        form: Object,
    };

    rstore = rstore;

    created() {
    }

    mounted() {
    }

    get mode() {
        return this.$store.state.config.mode;
    }
}

export default vueComponent(ToolBarTab);
//-----------------------------------------------------------------------------
</script>

<style scoped>
.label {
    width: 75px;
}

</style>
