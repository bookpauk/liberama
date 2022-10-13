<template>
    <div class="fit sets-tab-panel">
        <!---------------------------------------------->
        <div class="hidden sets-part-header">
            Шрифт
        </div>

        <div class="sets-item row">
            <div class="sets-label label">
                Локальный/веб
            </div>
            <div class="col row">
                <q-select
                    v-model="form.fontName" class="col-left" :options="fontsOptions" :disable="form.webFontName != ''"
                    dropdown-icon="la la-angle-down la-sm"
                    outlined dense emit-value map-options
                />

                <div class="q-px-sm" />
                <q-select
                    v-model="form.webFontName" class="col" :options="webFontsOptions"
                    dropdown-icon="la la-angle-down la-sm"
                    outlined dense emit-value map-options
                >
                    <q-tooltip :delay="1000" anchor="top middle" self="bottom middle" content-style="font-size: 80%">
                        Веб шрифты дают большое разнообразие,<br>
                        однако есть шанс, что шрифт будет загружаться<br>
                        очень медленно или вовсе не загрузится
                    </q-tooltip>
                </q-select>
            </div>
        </div>

        <div class="sets-item row">
            <div class="sets-label label">
                Размер
            </div>
            <div class="col row">
                <NumInput v-model="form.fontSize" class="col-left" :min="5" :max="200" />

                <div class="col q-pt-xs text-right">
                    <a href="https://fonts.google.com/?subset=cyrillic" target="_blank">Примеры</a>
                </div>
            </div>
        </div>

        <div class="sets-item row">
            <div class="sets-label label">
                Сдвиг
            </div>
            <div class="col row">
                <NumInput v-model="vertShift" class="col-left" :min="-100" :max="100">
                    <q-tooltip :delay="1000" anchor="top middle" self="bottom middle" content-style="font-size: 80%">
                        Сдвиг шрифта по вертикали в процентах от размера.<br>
                        Отрицательное значение сдвигает вверх, положительное -<br>
                        вниз. Значение зависит от метрики шрифта.
                    </q-tooltip>
                </NumInput>
            </div>
        </div>

        <div class="sets-item row">
            <div class="sets-label label">
                Стиль
            </div>
            <div class="col row">
                <q-checkbox v-model="fontBold" size="xs" label="Жирный" />
                <q-checkbox v-model="fontItalic" class="q-ml-sm" size="xs" label="Курсив" />
            </div>
        </div>
    </div>
</template>

<script>
//-----------------------------------------------------------------------------
import vueComponent from '../../../../vueComponent.js';

import NumInput from '../../../../share/NumInput.vue';
import rstore from '../../../../../store/modules/reader';

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
        fontBold: function(newValue) {
            if (!this.isFormChanged)
                this.form.fontWeight = (newValue ? 'bold' : '');
        },
        fontItalic: function(newValue) {
            if (!this.isFormChanged)
                this.form.fontStyle = (newValue ? 'italic' : '');
        },
        vertShift: function(newValue) {
            if (!this.isFormChanged) {
                const font = (this.form.webFontName ? this.form.webFontName : this.form.fontName);
                if (this.form.fontShifts[font] != newValue || this.form.fontVertShift != newValue) {
                    this.form.fontShifts = Object.assign({}, this.form.fontShifts, {[font]: newValue});
                    this.form.fontVertShift = newValue;
                }
            }
        },
    },
};
class Font {
    _options = componentOptions;
    _props = {
        form: Object,
    };

    fontBold = false;
    fontItalic = false;
    vertShift = 0;
    webFonts = [];
    fonts = [];    

    created() {
        this.formChanged();//no await
    }

    mounted() {
    }

    async formChanged() {
        this.isFormChanged = true;
        try {
            this.fontBold = (this.form.fontWeight == 'bold');
            this.fontItalic = (this.form.fontStyle == 'italic');

            this.fonts = rstore.fonts;
            this.webFonts = rstore.webFonts;
            const font = (this.form.webFontName ? this.form.webFontName : this.form.fontName);
            this.vertShift = this.form.fontShifts[font] || 0;
        } finally {
            await this.$nextTick();
            this.isFormChanged = false;
        }
    }

    get fontsOptions() {
        let result = [];
        this.fonts.forEach(font => {
            result.push({label: (font.label ? font.label : font.name), value: font.name});
        });
        return result;
    }

    get webFontsOptions() {
        let result = [{label: 'Нет', value: ''}];
        this.webFonts.forEach(font => {
            result.push({label: font.name, value: font.name});
        });
        return result;
    }

}

export default vueComponent(Font);
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
