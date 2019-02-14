<template>
    <div ref="main" class="main" @click="close">
        <div class="mainWindow" @click.stop>
            <Window @close="close">
                <template slot="header">
                    Настройки
                </template>

                <el-tabs type="border-card" tab-position="left" v-model="selectedTab">
                    <!--------------------------------------------------------------------------->
                    <el-tab-pane label="Вид">

                        <el-form :model="form" size="small" label-width="120px" @submit.native.prevent>
                            <div class="partHeader">Цвет</div>

                            <el-form-item label="Текст">
                                <el-col :span="12">
                                    <el-color-picker v-model="textColor" color-format="hex" :predefine="predefineTextColors"></el-color-picker>
                                    <span class="color-picked"><b>{{ textColor }}</b></span>
                                </el-col>
                                <el-col :span="5">
                                    <span style="position: relative; top: 20px;">Обои:</span>
                                </el-col>
                            </el-form-item>

                            <el-form-item label="Фон">
                                <el-col :span="12">
                                    <el-color-picker v-model="backgroundColor" color-format="hex" :predefine="predefineBackgroundColors" :disabled="wallpaper != ''"></el-color-picker>
                                    <span v-show="wallpaper == ''" class="color-picked"><b>{{ backgroundColor }}</b></span>
                                </el-col>

                                <el-col :span="11">
                                    <el-select v-model="wallpaper">
                                        <el-option label="Нет" value=""></el-option>
                                        <el-option label="1" value="paper1"></el-option>
                                        <el-option label="2" value="paper2"></el-option>
                                        <el-option label="3" value="paper3"></el-option>
                                        <el-option label="4" value="paper4"></el-option>
                                        <el-option label="5" value="paper5"></el-option>
                                        <el-option label="6" value="paper6"></el-option>
                                        <el-option label="7" value="paper7"></el-option>
                                        <el-option label="8" value="paper8"></el-option>
                                        <el-option label="9" value="paper9"></el-option>
                                    </el-select>
                                </el-col>
                            </el-form-item>
                        </el-form>

                        <el-form :model="form" size="mini" label-width="120px" @submit.native.prevent>
                            <div class="partHeader">Шрифт</div>

                            <el-form-item label="Локальный/веб">
                                <el-col :span="11">
                                    <el-select v-model="fontName" placeholder="Шрифт" :disabled="webFontName != ''">
                                        <el-option v-for="item in fonts"
                                            :key="item.name"
                                            :label="item.label"
                                            :value="item.name">
                                        </el-option>
                                    </el-select>
                                </el-col>
                                <el-col :span="1">
                                    &nbsp;
                                </el-col>
                                <el-col :span="11">
                                    <el-tooltip :open-delay="500" effect="light" placement="top">
                                        <template slot="content">
                                            Веб шрифты дают большое разнообразие,<br>
                                            однако есть шанс, что шрифт будет загружаться<br>
                                            очень медленно или вовсе не загрузится
                                        </template>
                                        <el-select v-model="webFontName">
                                            <el-option label="Нет" value=""></el-option>
                                            <el-option v-for="item in webFonts"
                                                :key="item.name"
                                                :value="item.name">
                                            </el-option>
                                        </el-select>
                                    </el-tooltip>
                                </el-col>
                            </el-form-item>
                            <el-form-item label="Размер">
                                <el-col :span="17">
                                    <el-input-number v-model="fontSize" :min="5" :max="200"></el-input-number>
                                </el-col>
                                <el-col :span="1">
                                    <a href="https://fonts.google.com/?subset=cyrillic" target="_blank">Примеры</a>
                                </el-col>
                            </el-form-item>
                            <el-form-item label="Сдвиг">
                                <el-tooltip :open-delay="500" effect="light">
                                    <template slot="content">
                                        Сдвиг шрифта по вертикали в процентах от размера.<br>
                                        Отрицательное значение сдвигает вверх, положительное -<br>
                                        вниз. Значение зависит от метрики шрифта.
                                    </template>
                                    <el-input-number v-model="vertShift" :min="-100" :max="100"></el-input-number>
                                </el-tooltip>
                            </el-form-item>

                            <el-form-item label="Стиль">
                                <el-col :span="8">
                                    <el-checkbox v-model="fontBold">Жирный</el-checkbox>
                                </el-col>
                                <el-col :span="8">
                                    <el-checkbox v-model="fontItalic">Курсив</el-checkbox>
                                </el-col>
                            </el-form-item>
                        </el-form>

                        <el-form :model="form" size="mini" label-width="120px" @submit.native.prevent>
                            <div class="partHeader">Текст</div>

                            <el-form-item label="Интервал">
                                <el-input-number v-model="lineInterval" :min="0" :max="200"></el-input-number>
                            </el-form-item>
                            <el-form-item label="Параграф">
                                <el-input-number v-model="p" :min="0" :max="1000"></el-input-number>
                            </el-form-item>
                            <el-form-item label="Отступ">
                                <el-col :span="11">
                                    <el-tooltip :open-delay="500" effect="light">
                                        <template slot="content">
                                            Слева/справа
                                        </template>
                                        <el-input-number v-model="indentLR" :min="0" :max="500"></el-input-number>
                                    </el-tooltip>
                                </el-col>
                                <el-col :span="1">
                                    &nbsp;
                                </el-col>
                                <el-col :span="11">
                                    <el-tooltip :open-delay="500" effect="light">
                                        <template slot="content">
                                            Сверху/снизу
                                        </template>
                                        <el-input-number v-model="indentTB" :min="0" :max="500"></el-input-number>
                                    </el-tooltip>
                                </el-col>
                            </el-form-item>
                            <el-form-item label="Сдвиг">
                                <el-tooltip :open-delay="500" effect="light">
                                    <template slot="content">
                                        Сдвиг текста по вертикали в процентах от размера шрифта.<br>
                                        Отрицательное значение сдвигает вверх, положительное -<br>
                                        вниз.
                                    </template>
                                    <el-input-number v-model="textVertShift" :min="-100" :max="100"></el-input-number>
                                </el-tooltip>
                            </el-form-item>
                            <el-form-item label="Скроллинг">
                                <el-col :span="11">
                                    <el-tooltip :open-delay="500" effect="light">
                                        <template slot="content">
                                            Замедление скроллинга в миллисекундах.<br>
                                            Определяет время, за которое текст<br>
                                            прокручивается на одну строку.
                                        </template>
                                        <el-input-number v-model="scrollingDelay" :min="1" :max="10000"></el-input-number>
                                    </el-tooltip>
                                </el-col>
                                <el-col :span="1">
                                    &nbsp;
                                </el-col>
                                <el-col :span="11">
                                    <el-tooltip :open-delay="500" effect="light" placement="top">
                                        <template slot="content">
                                            Вид скроллинга: линейный,<br>
                                            ускорение-замедление и пр.
                                        </template>

                                        <el-select v-model="scrollingType">
                                            <el-option value="linear"></el-option>
                                            <el-option value="ease"></el-option>
                                            <el-option value="ease-in"></el-option>
                                            <el-option value="ease-out"></el-option>
                                            <el-option value="ease-in-out"></el-option>
                                        </el-select>
                                    </el-tooltip>
                                </el-col>

                            </el-form-item>
                            <el-form-item label="Выравнивание">
                                <el-checkbox v-model="textAlignJustify">По ширине</el-checkbox>
                                <el-checkbox v-model="wordWrap">Перенос по слогам</el-checkbox>
                            </el-form-item>
                            <el-form-item label="Обработка">
                                <el-checkbox v-model="cutEmptyParagraphs" @change="needReload">Убирать пустые параграфы</el-checkbox>
                            </el-form-item>
                            <el-form-item label="">
                                <el-col :span="12">
                                    Добавлять пустые
                                </el-col>
                                <el-input-number v-model="addEmptyParagraphs" :min="0" :max="2" @change="needReload"></el-input-number>
                            </el-form-item>
                            
                        </el-form>

                        <el-form :model="form" size="mini" label-width="120px" @submit.native.prevent>
                            <div class="partHeader">Строка статуса</div>

                            <el-form-item label="Статус">
                                <el-checkbox v-model="showStatusBar">Показывать</el-checkbox>
                                <el-checkbox v-model="statusBarTop" :disabled="!showStatusBar">Вверху/внизу</el-checkbox>
                            </el-form-item>
                            <el-form-item label="Высота">
                                <el-input-number v-model="statusBarHeight" :min="5" :max="100" :disabled="!showStatusBar"></el-input-number>
                            </el-form-item>
                            <el-form-item label="Прозрачность">
                                <el-input-number v-model="statusBarColorAlpha" :min="0" :max="1" :precision="2" :step="0.1" :disabled="!showStatusBar"></el-input-number>
                            </el-form-item>
                        </el-form>
                    </el-tab-pane>

                    <!--------------------------------------------------------------------------->
                    <el-tab-pane label="Листание">
                        <el-form :model="form" size="mini" label-width="120px" @submit.native.prevent>
                            <div class="partHeader">Анимация</div>

                            <el-form-item label="Вид">
                                не готово
                            </el-form-item>

                            <el-form-item label="Скорость">
                                не готово
                            </el-form-item>
                        </el-form>

                        <el-form :model="form" size="mini" label-width="120px" @submit.native.prevent>
                            <div class="partHeader">Другое</div>

                            <el-form-item label="Страница">
                                <el-tooltip :open-delay="500" effect="light">
                                    <template slot="content">
                                        Переносить последнюю строку страницы<br>
                                        в начало следующей при листании
                                    </template>
                                    <el-checkbox v-model="keepLastToFirst">Переносить последнюю строку</el-checkbox>
                                </el-tooltip>
                            </el-form-item>
                        </el-form>
                        
                    </el-tab-pane>
                    <!--------------------------------------------------------------------------->
                    <el-tab-pane label="Прочее">
                        <el-form :model="form" size="mini" label-width="120px" @submit.native.prevent>
                            <el-form-item label="Управление">
                                <el-checkbox v-model="clickControl">Включить управление кликом</el-checkbox>
                            </el-form-item>
                            <el-form-item label="Подсказка">
                                <el-tooltip :open-delay="500" effect="light">
                                    <template slot="content">
                                        Показывать или нет подсказку при каждой загрузке книги
                                    </template>
                                    <el-checkbox v-model="showClickMapPage">Показывать области управления кликом</el-checkbox>
                                </el-tooltip>
                            </el-form-item>
                            <el-form-item label="URL">
                                <el-tooltip :open-delay="500" effect="light">
                                    <template slot="content">
                                        Добавление параметра "__p" в строке браузера<br>
                                        позволяет передавать ссылку на книгу в читалке<br>
                                        без потери текущей позиции. Однако в этом случае<br>
                                        при листании забивается история браузера, т.к. на<br>
                                        каждое изменение позиции происходит смена URL.
                                    </template>
                                    <el-checkbox v-model="allowUrlParamBookPos">Добавлять параметр "__p"</el-checkbox>
                                </el-tooltip>
                            </el-form-item>
                            <el-form-item label="Парсинг">
                                <el-tooltip :open-delay="500" effect="light">
                                    <template slot="content">
                                        Включение этой опции позволяет делать предварительную<br>
                                        обработку текста в ленивом режиме сразу после загрузки<br>
                                        книги. Это может повысить отзывчивость читалки, но<br>
                                        нагружает процессор каждый раз при открытии книги.
                                    </template>
                                    <el-checkbox v-model="lazyParseEnabled">Предварительная обработка текста</el-checkbox>
                                </el-tooltip>
                            </el-form-item>
                            <el-form-item label="Копирование">
                                <el-tooltip :open-delay="500" effect="light">
                                    <template slot="content">
                                        Загружать весь текст в окно<br>
                                        копирования текста со страницы
                                    </template>
                                    <el-checkbox v-model="copyFullText">Загружать весь текст</el-checkbox>
                                </el-tooltip>
                            </el-form-item>

                        </el-form>
                        
                    </el-tab-pane>

                </el-tabs>
            </Window>
        </div>
    </div>
</template>

<script>
//-----------------------------------------------------------------------------
import Vue from 'vue';
import Component from 'vue-class-component';

import Window from '../../share/Window.vue';
import rstore from '../../../store/modules/reader';

export default @Component({
    components: {
        Window,
    },
    data: function() {
        return Object.assign({}, rstore.settingDefaults);
    },
    watch: {
        form: function(newValue) {
            this.commit('reader/setSettings', newValue);
        },
        fontBold: function(newValue) {
            this.fontWeight = (newValue ? 'bold' : '');
        },
        fontItalic: function(newValue) {
            this.fontStyle = (newValue ? 'italic' : '');
        },
        vertShift: function(newValue) {
            const font = (this.webFontName ? this.webFontName : this.fontName);
            this.fontShifts = Object.assign({}, this.fontShifts, {[font]: newValue});
            this.fontVertShift = newValue;
        },
        fontName: function(newValue) {
            const font = (this.webFontName ? this.webFontName : newValue);
            this.vertShift = this.fontShifts[font] || 0;
        },
        webFontName: function(newValue) {
            const font = (newValue ? newValue : this.fontName);
            this.vertShift = this.fontShifts[font] || 0;
        },
    },
})
class SettingsPage extends Vue {
    selectedTab = null;
    form = {};
    fontBold = false;
    fontItalic = false;
    vertShift = 0;

    webFonts = [];
    fonts = [];

    created() {
        this.commit = this.$store.commit;
        this.reader = this.$store.state.reader;

        this.form = Object.assign({}, this.settings);
        for (let prop in rstore.settingDefaults) {
            this[prop] = this.form[prop];
            this.$watch(prop, (newValue) => {
                this.form = Object.assign({}, this.form, {[prop]: newValue});
            });
        }
        this.fontBold = (this.fontWeight == 'bold');
        this.fontItalic = (this.fontStyle == 'italic');

        this.fonts = rstore.fonts;
        this.webFonts = rstore.webFonts;
        const font = (this.webFontName ? this.webFontName : this.fontName);
        this.vertShift = this.fontShifts[font] || 0;
    }

    get settings() {
        return this.$store.state.reader.settings;
    }

    get predefineTextColors() {
        return [
          '#ffffff',
          '#000000',
          '#202020',
          '#323232',
          '#aaaaaa',
          '#00c0c0',
        ];
    }

    get predefineBackgroundColors() {
        return [
          '#ffffff',
          '#000000',
          '#202020',
          '#ebe2c9',
          '#909080',
          '#808080',
          '#c8c8c8',
          '#478355',
          '#a6caf0',
        ];
    }

    needReload() {
        this.$notify.warning({message: 'Необходимо обновить страницу (F5), чтобы изменения возымели эффект'});
    }

    close() {
        this.$emit('settings-toggle');
    }

    keyHook(event) {
        if (event.type == 'keydown' && event.code == 'Escape') {
            this.close();
        }
        return true;
    }
}
//-----------------------------------------------------------------------------
</script>

<style scoped>
.main {
    position: absolute;
    width: 100%;
    height: 100%;
    z-index: 60;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}

.mainWindow {
    height: 70%;
    display: flex;
    position: relative;
}

.el-form {
    border-top: 2px solid #bbbbbb;
    margin-bottom: 5px;
}

.el-form-item {
    padding: 0;
    margin: 0;
    margin-bottom: 5px;
}

.color-picked {
    margin-left: 10px;
    position: relative;
    top: -11px;
}

.partHeader {
    font-weight: bold;
    margin-bottom: 5px;
}

.el-tabs {
    flex: 1;
    display: flex;
}

.el-tab-pane {
    flex: 1;
    display: flex;
    flex-direction: column;
    width: 420px;
    overflow-y: auto;
    padding: 15px;
}

</style>