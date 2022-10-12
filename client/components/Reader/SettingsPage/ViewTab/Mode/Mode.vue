<template>
    <div class="fit sets-tab-panel">
        <!---------------------------------------------->
        <div class="hidden sets-part-header">
            Режим
        </div>

        <div class="sets-item row">
            <div class="sets-label label"></div>
            <div class="col row">
                <q-checkbox v-model="form.dualPageMode" size="xs" label="Двухстраничный режим" />
            </div>
        </div>

        <div class="sets-part-header">
            Страницы
        </div>
        <div class="sets-item row">
            <div class="sets-label label">
                Отступ границ
            </div>
            <div class="col row">
                <NumInput v-model="form.indentLR" class="col-left" :min="0" :max="2000">
                    <q-tooltip :delay="1000" anchor="top middle" self="bottom middle" content-style="font-size: 80%">
                        Слева/справа от края экрана
                    </q-tooltip>
                </NumInput>
                <div class="q-px-sm" />
                <NumInput v-model="form.indentTB" class="col" :min="0" :max="2000">
                    <q-tooltip :delay="1000" anchor="top middle" self="bottom middle" content-style="font-size: 80%">
                        Сверху/снизу от края экрана
                    </q-tooltip>
                </NumInput>
            </div>
        </div>

        <div v-show="form.dualPageMode" class="sets-item row">
            <div class="sets-label label">
                Отступ внутри
            </div>
            <div class="col row">
                <NumInput v-model="form.dualIndentLR" class="col-left" :min="0" :max="2000">
                    <q-tooltip :delay="1000" anchor="top middle" self="bottom middle" content-style="font-size: 80%">
                        Слева/справа внутри страницы
                    </q-tooltip>
                </NumInput>
            </div>
        </div>

        <div v-show="form.dualPageMode">
            <div class="sets-part-header">
                Разделитель
            </div>

            <div class="sets-item row no-wrap">
                <div class="sets-label label">
                    Цвет
                </div>
                <div class="col-left row">
                    <q-input 
                        v-model="dualDivColorFiltered"
                        class="col-left no-mp"
                        outlined dense
                        :rules="['hexColor']"
                        style="max-width: 150px"
                        :disable="form.dualDivColorAsText"
                    >
                        <template #prepend>
                            <q-icon name="la la-angle-down la-xs" class="cursor-pointer text-white" :style="helper.colorPanStyle(form.dualDivColor)">
                                <q-popup-proxy anchor="bottom middle" self="top middle">
                                    <div>
                                        <q-color
                                            v-model="form.dualDivColor"
                                            no-header default-view="palette" :palette="defPalette.predefineTextColors"
                                        />
                                    </div>
                                </q-popup-proxy>
                            </q-icon>
                        </template>
                    </q-input>
                </div>
                
                <div class="q-px-xs" />
                <q-checkbox v-model="form.dualDivColorAsText" size="xs" label="Как у текста" />
            </div>

            <div class="sets-item row">
                <div class="sets-label label">
                    Прозрачность
                </div>
                <div class="col row">
                    <NumInput v-model="form.dualDivColorAlpha" class="col-left" :min="0" :max="1" :digits="2" :step="0.1" />
                </div>
            </div>

            <div class="sets-item row">
                <div class="sets-label label">
                    Ширина (px)
                </div>
                <div class="col row">
                    <NumInput v-model="form.dualDivWidth" class="col-left" :min="0" :max="100">
                        <q-tooltip :delay="1000" anchor="top middle" self="bottom middle" content-style="font-size: 80%">
                            Ширина разделителя
                        </q-tooltip>
                    </NumInput>
                </div>
            </div>

            <div class="sets-item row">
                <div class="sets-label label">
                    Высота (%)
                </div>
                <div class="col row">
                    <NumInput v-model="form.dualDivHeight" class="col-left" :min="0" :max="100">
                        <q-tooltip :delay="1000" anchor="top middle" self="bottom middle" content-style="font-size: 80%">
                            Высота разделителя
                        </q-tooltip>
                    </NumInput>
                </div>
            </div>

            <div class="sets-item row">
                <div class="sets-label label">
                    Пунктир
                </div>
                <div class="col row">
                    <NumInput v-model="form.dualDivStrokeFill" class="col-left" :min="0" :max="2000">
                        <q-tooltip :delay="1000" anchor="top middle" self="bottom middle" content-style="font-size: 80%">
                            Заполнение пунктира
                        </q-tooltip>
                    </NumInput>
                    <div class="q-px-sm" />
                    <NumInput v-model="form.dualDivStrokeGap" class="col" :min="0" :max="2000">
                        <q-tooltip :delay="1000" anchor="top middle" self="bottom middle" content-style="font-size: 80%">
                            Промежуток пунктира
                        </q-tooltip>
                    </NumInput>
                </div>
            </div>

            <div class="sets-item row">
                <div class="sets-label label">
                    Ширина тени
                </div>
                <div class="col row">
                    <NumInput v-model="form.dualDivShadowWidth" class="col-left" :min="0" :max="100" />
                </div>
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
        NumInput
    },
    watch: {
        form() {
            this.formChanged();//no await
        },
        dualDivColorFiltered(newValue) {
            if (!this.isFormChanged && this.helper.isHexColor(newValue))
                this.form.dualDivColor = newValue;
        },
    }
};
class Mode {
    _options = componentOptions;
    _props = {
        form: Object,
    };

    helper = helper;
    defPalette = defPalette;

    isFormChanged = false;
    dualDivColorFiltered = '';

    created() {
        this.formChanged();//no await
    }

    mounted() {
    }

    async formChanged() {
        this.isFormChanged = true;
        try {
            this.dualDivColorFiltered = this.form.dualDivColor;

            if (this.form.dualPageMode 
                && (this.form.pageChangeAnimation == 'flip' || this.form.pageChangeAnimation == 'rightShift')
                )
                this.form.pageChangeAnimation = '';
        } finally {
            await this.$nextTick();
            this.isFormChanged = false;
        }
    }
}

export default vueComponent(Mode);
//-----------------------------------------------------------------------------
</script>

<style scoped>
.label {
    width: 110px;
}

.col-left {
    width: 150px;
}

.no-mp {
    margin: 0;
    padding: 0;
}
</style>
