<template>
    <div class="fit sets-tab-panel">
        <!---------------------------------------------->
        <div class="sets-part-header">
            Анимация
        </div>

        <div class="sets-item row">
            <div class="sets-label label">
                Тип
            </div>
            <q-select
                v-model="form.pageChangeAnimation" bg-color="input" class="col-left" :options="pageChangeAnimationOptions"
                dropdown-icon="la la-angle-down la-sm"
                outlined dense emit-value map-options
            />
        </div>

        <div class="sets-item row">
            <div class="sets-label label">
                Скорость
            </div>
            <NumInput v-model="form.pageChangeAnimationSpeed" bg-color="input" class="col-left" :min="0" :max="100" :disable="form.pageChangeAnimation == ''" />
        </div>

        <!---------------------------------------------->
        <div class="sets-part-header">
            Другое
        </div>

        <div class="sets-item row">
            <div class="sets-label label">
                Страница
            </div>
            <q-checkbox v-model="form.keepLastToFirst" size="xs" label="Переносить последнюю строку">
                <q-tooltip :delay="1000" anchor="top middle" self="bottom middle" content-style="font-size: 80%">
                    Переносить последнюю строку страницы<br>
                    в начало следующей при листании
                </q-tooltip>
            </q-checkbox>
        </div>
    </div>
</template>

<script>
//-----------------------------------------------------------------------------
import vueComponent from '../../../vueComponent.js';
import NumInput from '../../../share/NumInput.vue';

const componentOptions = {
    components: {
        NumInput,
    },
};
class PageMoveTab {
    _options = componentOptions;
    _props = {
        form: Object,
    };

    created() {
    }

    mounted() {
    }

    get pageChangeAnimationOptions() {
        let result = [
            {label: 'Нет', value: ''},
            {label: 'Вверх-вниз', value: 'downShift'},
            (!this.form.dualPageMode ? {label: 'Вправо-влево', value: 'rightShift'} : null),
            {label: 'Протаивание', value: 'thaw'},
            {label: 'Мерцание', value: 'blink'},
            {label: 'Вращение', value: 'rotate'},
            (this.form.wallpaper == '' && !this.form.dualPageMode ? {label: 'Листание', value: 'flip'} : null),
        ];        

        result = result.filter(v => v);

        return result;
    }
}

export default vueComponent(PageMoveTab);
//-----------------------------------------------------------------------------
</script>

<style scoped>
.label {
    width: 110px;
}

.col-left {
    width: 150px;
}
</style>
