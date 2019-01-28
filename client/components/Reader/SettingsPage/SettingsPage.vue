<template>
    <div ref="main" class="main" @click="close">
        <div class="mainWindow" @click.stop>
            <Window @close="close">
                <template slot="header">
                    Настройки
                </template>

                <el-tabs class="tabs" type="border-card" tab-position="left" v-model="selectedTab">
                    <el-tab-pane label="Вид">

                        <el-form :model="form" size="small" label-width="120px">
                            <div class="partHeader">Цвет</div>

                            <el-form-item label="Текст">
                                <el-color-picker v-model="textColor" color-format="hex" :predefine="predefineTextColors"></el-color-picker>
                                <span class="color-picked"><b>{{ textColor }}</b></span>
                            </el-form-item>

                            <el-form-item label="Фон">
                                <el-color-picker v-model="backgroundColor" color-format="hex" :predefine="predefineBackgroundColors"></el-color-picker>
                                <span class="color-picked"><b>{{ backgroundColor }}</b></span>
                            </el-form-item>
                        </el-form>

                        <el-form :model="form" size="mini" label-width="120px">
                            <div class="partHeader">Шрифт</div>

                            <el-form-item label="Локальный/веб">
                                    <el-col :span="10">
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
                                    <el-col :span="10">
                                        <el-select v-model="webFontName">
                                            <el-option label="Нет" value=""></el-option>
                                            <el-option v-for="item in webFonts"
                                                :key="item.name"
                                                :value="item.name">
                                            </el-option>
                                        </el-select>
                                    </el-col>
                            </el-form-item>
                            <el-form-item label="Размер">
                                    <el-col :span="10">
                                        <el-input-number v-model="fontSize" :min="5" :max="100"></el-input-number>
                                    </el-col>
                            </el-form-item>

                            <el-form-item label="Стиль">
                                <el-col :span="11">
                                    <el-checkbox v-model="fontBold">Жирный</el-checkbox>
                                </el-col>
                                <el-col :span="11">
                                    <el-checkbox v-model="fontItalic">Курсив</el-checkbox>
                                </el-col>
                            </el-form-item>
                        </el-form>

                        <el-form :model="form" size="mini" label-width="120px">
                            <div class="partHeader">Текст</div>

                            <el-form-item label="Интервал">
                                <el-input-number v-model="lineInterval" :min="0" :max="100"></el-input-number>
                            </el-form-item>
                            <el-form-item label="Параграф">
                                <el-input-number v-model="p" :min="0" :max="200"></el-input-number>
                            </el-form-item>
                            <el-form-item label="Выравнивание">
                                <el-checkbox v-model="textAlignJustify">По ширине</el-checkbox>
                                <el-checkbox v-model="wordWrap">Перенос по слогам</el-checkbox>
                            </el-form-item>
                        </el-form>

                        <el-form :model="form" size="mini" label-width="120px">
                            <div class="partHeader">Строка статуса</div>

                            <el-form-item label="Статус">
                                <el-checkbox v-model="showStatusBar">Показывать</el-checkbox>
                                <el-checkbox v-model="statusBarTop" :disabled="!showStatusBar">Вверху/внизу</el-checkbox>
                            </el-form-item>
                            <el-form-item label="Высота">
                                <el-input-number v-model="statusBarHeight" :min="5" :max="50" :disabled="!showStatusBar"></el-input-number>
                            </el-form-item>
                            <el-form-item label="Прозрачность">
                                <el-input-number v-model="statusBarColorAlpha" :min="0" :max="1" :precision="2" :step="0.1" :disabled="!showStatusBar"></el-input-number>
                            </el-form-item>
                        </el-form>
                    </el-tab-pane>
                    <el-tab-pane label="Листание">
                        <el-form :model="form" size="mini" label-width="120px">
                            <div class="partHeader">Анимация</div>

                            <el-form-item label="Вид">
                                не готово
                            </el-form-item>

                            <el-form-item label="Скорость">
                                не готово
                            </el-form-item>
                        </el-form>

                        <el-form :model="form" size="mini" label-width="120px">
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
                    <el-tab-pane label="Другое">
                        <el-form :model="form" size="mini" label-width="120px">
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

const propsData = {
    textColor: '#000000',
    backgroundColor: '#EBE2C9',
    fontStyle: '',// 'italic'
    fontWeight: '',// 'bold'
    fontSize: 20,// px
    fontName: 'ReaderDefault',
    webFontName: '',

    lineInterval: 3,// px, межстрочный интервал
    textAlignJustify: true,// выравнивание по ширине
    p: 25,// px, отступ параграфа
    indent: 15,// px, отступ всего текста слева и справа
    wordWrap: true,//перенос по слогам
    keepLastToFirst: true,// перенос последней строки в первую при листании

    showStatusBar: true,
    statusBarTop: false,// top, bottom
    statusBarHeight: 19,// px
    statusBarColorAlpha: 0.4,

    pageChangeTransition: '',// '' - нет, downShift, rightShift, thaw - протаивание, blink - мерцание
    pageChangeTransitionSpeed: 50, //0-100%

    allowUrlParamBookPos: true,
};

export default @Component({
    components: {
        Window,
    },
    data: function() {
        return Object.assign({}, propsData);
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
    },
})
class SettingsPage extends Vue {
    selectedTab = null;
    form = {};
    fontBold = false;
    fontItalic = false;

    webFonts = [];
    fonts = [];

    created() {
        this.commit = this.$store.commit;
        this.reader = this.$store.state.reader;

        this.form = this.settings;
        for (let prop in propsData) {
            this[prop] = this.form[prop];
            this.$watch(prop, (newValue) => {
                this.form = Object.assign({}, this.form, {[prop]: newValue})
            });
        }
        this.fontBold = (this.fontWeight == 'bold');
        this.fontItalic = (this.fontStyle == 'italic');

        this.fonts = rstore.fonts;
        this.webFonts = rstore.webFonts;
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
          '#478355',
          '#909080',
          '#808080',
          '#a6caf0',
          '#c8c8c8',
        ];
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

.tabs {
    flex: 1;
    display: flex;
}

.el-tab-pane {
    width: 420px;
    height: 100%;
    overflow-y: auto;
}

</style>