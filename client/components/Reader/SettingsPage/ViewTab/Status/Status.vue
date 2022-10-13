<template>
    <div>
        <!---------------------------------------------->
        <div class="hidden sets-part-header">
            Строка статуса
        </div>

        <div class="sets-item row">
            <div class="sets-label label">
                Статус
            </div>
            <div class="col row">
                <q-checkbox v-model="form.showStatusBar" size="xs" label="Показывать" />
                <q-checkbox v-show="form.showStatusBar" v-model="form.statusBarTop" class="q-ml-sm" size="xs" label="Вверху/внизу" />
            </div>
        </div>

        <div v-show="form.showStatusBar" class="sets-item row no-wrap">
            <div class="sets-label label">
                Цвет
            </div>
            <div class="col-left row">
                <q-input
                    v-model="statusBarColorFiltered"
                    class="col-left no-mp"
                    outlined dense
                    :rules="['hexColor']"
                    style="max-width: 150px"
                    :disable="form.statusBarColorAsText"
                >
                    <template #prepend>
                        <q-icon name="la la-angle-down la-xs" class="cursor-pointer text-white" :style="helper.colorPanStyle(form.statusBarColor)">
                            <q-popup-proxy anchor="bottom middle" self="top middle">
                                <div>
                                    <q-color
                                        v-model="form.statusBarColor"
                                        no-header default-view="palette" :palette="defPalette.predefineTextColors"
                                    />
                                </div>
                            </q-popup-proxy>
                        </q-icon>
                    </template>
                </q-input>
            </div>
            
            <div class="q-px-xs" />
            <q-checkbox v-model="form.statusBarColorAsText" size="xs" label="Как у текста" />
        </div>

        <div v-show="form.showStatusBar" class="sets-item row">
            <div class="sets-label label">
                Прозрачность
            </div>
            <div class="col row">
                <NumInput v-model="form.statusBarColorAlpha" class="col-left" :min="0" :max="1" :digits="2" :step="0.1" />
            </div>
        </div>

        <div v-show="form.showStatusBar" class="sets-item row">
            <div class="sets-label label">
                Высота
            </div>
            <div class="col row">
                <NumInput v-model="form.statusBarHeight" class="col-left" :min="5" :max="100" />
            </div>
        </div>

        <div v-show="form.showStatusBar" class="sets-item row">
            <div class="sets-label label"></div>
            <div class="col row">
                <q-checkbox v-model="form.statusBarClickOpen" size="xs" label="Открывать оригинал по клику">
                    <q-tooltip :delay="1000" anchor="top middle" self="bottom middle" content-style="font-size: 80%">
                        По клику на автора-название в строке статуса<br>
                        открывать оригинал произведения в новой вкладке
                    </q-tooltip>
                </q-checkbox>
            </div>
        </div>
    </div>
</template>

<script>
//-----------------------------------------------------------------------------
import vueComponent from '../../../../vueComponent.js';
import NumInput from '../../../../share/NumInput.vue';
import * as helper from '../helper';
import defPalette from '../defPalette';

const componentOptions = {
    components: {
        NumInput,
    },
    watch: {
        form: {
            handler() {
                this.formChanged();//no await
            },
            deep: true,
        },
        statusBarColorFiltered(newValue) {
            if (!this.isFormChanged && this.helper.isHexColor(newValue))
                this.form.statusBarColor = newValue;
        },
    },
};
class Text {
    _options = componentOptions;
    _props = {
        form: Object,
    };

    helper = helper;
    defPalette = defPalette;

    statusBarColorFiltered = '';

    created() {
        this.formChanged();//no await
    }

    mounted() {
    }

    async formChanged() {
        this.isFormChanged = true;
        try {
            this.statusBarColorFiltered = this.form.statusBarColor;
        } finally {
            await this.$nextTick();
            this.isFormChanged = false;
        }
    }

}

export default vueComponent(Text);
//-----------------------------------------------------------------------------
</script>

<style scoped>
.label {
    width: 110px;
}

.col-left {
    width: 145px;
}

.no-mp {
    margin: 0;
    padding: 0;
}
</style>
