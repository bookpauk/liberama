<template>
    <div>
        <!---------------------------------------------->
        <div class="hidden sets-part-header">
            Текст
        </div>

        <div class="sets-item row">
            <div class="sets-label label">
                Интервал
            </div>
            <div class="col row">
                <NumInput v-model="form.lineInterval" bg-color="input" class="col-left" :min="0" :max="200" />
            </div>
        </div>

        <div class="sets-item row">
            <div class="sets-label label">
                Параграф
            </div>
            <div class="col row">
                <NumInput v-model="form.p" bg-color="input" class="col-left" :min="0" :max="2000" />
            </div>
        </div>

        <div class="sets-item row">
            <div class="sets-label label">
                Сдвиг
            </div>
            <div class="col row">
                <NumInput v-model="form.textVertShift" bg-color="input" class="col-left" :min="-100" :max="100">
                    <q-tooltip :delay="1000" anchor="top middle" self="bottom middle" content-style="font-size: 80%">
                        Сдвиг текста по вертикали в процентах от размера шрифта.<br>
                        Отрицательное значение сдвигает вверх, положительное -<br>
                        вниз.
                    </q-tooltip>
                </NumInput>
            </div>
        </div>

        <div class="sets-item row">
            <div class="sets-label label">
                Скроллинг
            </div>
            <div class="col row">
                <NumInput v-model="form.scrollingDelay" bg-color="input" class="col-left" :min="1" :max="10000">
                    <q-tooltip :delay="1000" anchor="top middle" self="bottom middle" content-style="font-size: 80%">
                        Замедление скроллинга в миллисекундах.<br>
                        Определяет время, за которое текст<br>
                        прокручивается на одну строку.
                    </q-tooltip>
                </NumInput>

                <div class="q-px-sm" />
                <q-select
                    v-model="form.scrollingType" bg-color="input" class="col" :options="['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out']"
                    dropdown-icon="la la-angle-down la-sm"
                    outlined dense emit-value map-options
                >
                    <q-tooltip :delay="1000" anchor="top middle" self="bottom middle" content-style="font-size: 80%">
                        Вид скроллинга: линейный,<br>
                        ускорение-замедление и пр.
                    </q-tooltip>
                </q-select>
            </div>
        </div>

        <div class="sets-item row">
            <div class="sets-label label">
                Выравнивание
            </div>
            <div class="col row">
                <q-checkbox v-model="form.textAlignJustify" size="xs" label="По ширине" />
                <q-checkbox v-model="form.wordWrap" class="q-ml-sm" size="xs" label="Перенос по слогам" />
            </div>
        </div>

        <div class="sets-item row">
            <div class="sets-label label"></div>
            <div class="col-left column justify-center text-right">
                Компактность
            </div>
            <div class="q-px-sm" />
            <NumInput v-model="form.compactTextPerc" bg-color="input" class="col" :min="0" :max="100">
                <q-tooltip :delay="1000" anchor="top middle" self="bottom middle" content-style="font-size: 80%">
                    Степень компактности текста в процентах.<br>
                    Чем больше компактность, тем хуже выравнивание<br>
                    по правому краю.
                </q-tooltip>
            </NumInput>
        </div>

        <div class="sets-item row">
            <div class="sets-label label">
                Обработка
            </div>
            <div class="col row">
                <q-checkbox v-model="form.cutEmptyParagraphs" size="xs" label="Убирать пустые строки" />
            </div>
        </div>

        <div class="sets-item row">
            <div class="sets-label label"></div>
            <div class="col-left column justify-center text-right">
                Добавлять пустые
            </div>
            <div class="q-px-sm" />
            <NumInput v-model="form.addEmptyParagraphs" bg-color="input" class="col" :min="0" :max="2" />
        </div>

        <div class="sets-item row">
            <div class="sets-label label">
                Изображения
            </div>
            <div class="col row">
                <q-checkbox v-model="form.showImages" size="xs" label="Показывать" />
                <q-checkbox v-model="form.showInlineImagesInCenter" class="q-ml-sm" :disable="!form.showImages" size="xs" label="Инлайн в центр" @update:modelValue="needReload">
                    <q-tooltip :delay="1000" anchor="top middle" self="bottom middle" content-style="font-size: 80%">
                        Выносить все изображения в центр экрана
                    </q-tooltip>
                </q-checkbox>
            </div>
        </div>

        <div class="sets-item row">
            <div class="sets-label label"></div>
            <div class="col row">
                <q-checkbox v-model="form.imageFitWidth" size="xs" label="Ширина не более размера страницы" :disable="!form.showImages || form.dualPageMode" />
            </div>
        </div>

        <div class="sets-item row">
            <div class="sets-label label"></div>
            <div class="col-left column justify-center text-right">
                Высота не более
            </div>
            <div class="q-px-sm" />
            <NumInput v-model="form.imageHeightLines" bg-color="input" class="col" :min="1" :max="100" :disable="!form.showImages">
                <q-tooltip :delay="1000" anchor="top middle" self="bottom middle" content-style="font-size: 80%">
                    Определяет высоту изображения количеством строк.<br>
                    В случае превышения высоты, изображение будет<br>
                    уменьшено с сохранением пропорций так, чтобы<br>
                    помещаться в указанное количество строк.
                </q-tooltip>
            </NumInput>
        </div>
    </div>
</template>

<script>
//-----------------------------------------------------------------------------
import vueComponent from '../../../../vueComponent.js';
import NumInput from '../../../../share/NumInput.vue';

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
    },
};
class Text {
    _options = componentOptions;
    _props = {
        form: Object,
    };

    statusBarColorFiltered = '';

    created() {
        this.formChanged();//no await
    }

    mounted() {
    }

    async formChanged() {
        this.isFormChanged = true;
        try {
            //
        } finally {
            await this.$nextTick();
            this.isFormChanged = false;
        }
    }

    needReload() {
        this.$root.notify.warning('Необходимо обновить страницу (F5), чтобы изменения возымели эффект');
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
</style>
