<template>
    <div class="fit sets-tab-panel">
        <div class="sets-item row">
            <q-btn class="col q-ma-sm" dense no-caps @click="setDefaults">
                Установить по умолчанию
            </q-btn>
        </div>
    </div>
</template>

<script>
//-----------------------------------------------------------------------------
import vueComponent from '../../../vueComponent.js';

const componentOptions = {
    components: {
    },
};
class ResetTab {
    _options = componentOptions;
    _props = {
        form: Object,
    };

    created() {
    }

    mounted() {
    }

    setDefaults() {
        this.$emit('tab-event', {action: 'set-defaults'});
    }
}

export default vueComponent(ResetTab);
//-----------------------------------------------------------------------------
</script>

<style scoped>
</style>
