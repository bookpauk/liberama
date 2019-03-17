<template>
    <div ref="main" class="main" @click="close">
        <div class="mainWindow" @click.stop>
            <Window @close="close">
                <template slot="header">
                    Настройки
                </template>

                <el-tabs type="border-card" tab-position="left" v-model="selectedTab">
                    <!-- Профили ------------------------------------------------------------------------->
                    <el-tab-pane label="Профили">
                        <el-form :model="form" size="small" label-width="100px" @submit.native.prevent>
                            <div class="partHeader">Профили устройств</div>

                            <el-form-item label="">
                                <div class="text">
                                    Выберите или добавьте профиль устройства, чтобы начать синхронизацию данных с сервером.
                                    При выборе "Нет" синхронизация отключается.
                                </div>
                            </el-form-item>

                            <el-form-item label="Устройство">
                                <el-select v-model="currentProfile" placeholder="">
                                    <el-option label="Нет" value=""></el-option>
                                    <el-option v-for="item in profilesArray"
                                        :key="item"
                                        :label="item"
                                        :value="item">
                                    </el-option>
                                </el-select>
                            </el-form-item>

                            <el-form-item label="">
                                    <el-button @click="addProfile">Добавить</el-button>
                                    <el-button @click="delProfile">Удалить</el-button>
                                    <el-button @click="delAllProfiles">Удалить все</el-button>
                            </el-form-item>
                        </el-form>

                        <el-form :model="form" size="small" label-width="100px" @submit.native.prevent>
                            <div class="partHeader">Ключ доступа</div>

                            <el-form-item label="">
                                <div class="text">
                                    Ключ доступа позволяет восстановить профили с настройками и список читаемых книг
                                    на другом устройстве. Для этого необходимо передать его через почту, мессенджер или другим способом.
                                </div>
                            </el-form-item>

                            <el-form-item label="">
                                    <el-button style="width: 250px" @click="showServerStorageKey">
                                        <span v-show="serverStorageKeyVisible">Скрыть</span>
                                        <span v-show="!serverStorageKeyVisible">Показать</span>
                                        ключ доступа/ссылку
                                 </el-button>
                            </el-form-item>

                            <el-form-item label="">
                                <div v-if="!serverStorageKeyVisible">
                                    <b>{{ partialStorageKey }}</b> (часть вашего ключа)
                                </div>
                                <div v-else style="line-height: 100%">
                                    <hr/>
                                    <div style="width: 300px; overflow-wrap: break-word;"><b>{{ serverStorageKey }}</b></div>
                                    <br><div class="center">
                                        <el-button size="mini" class="copy-button" @click="copyToClip(serverStorageKey, 'Ключ')">Скопировать ключ</el-button>
                                    </div>
                                    <div v-if="mode == 'omnireader'">
                                        <br>Переход по ссылке позволит автоматически ввести ключ доступа:
                                        <br><div class="center" style="margin-top: 5px">
                                            <a :href="setStorageKeyLink" target="_blank">Ссылка для ввода ключа</a>
                                        </div>
                                        <br><div class="center">
                                            <el-button size="mini" class="copy-button" @click="copyToClip(setStorageKeyLink, 'Ссылка')">Скопировать ссылку</el-button>
                                        </div>
                                    </div>
                                    <hr/>
                                </div>
                            </el-form-item>

                            <el-form-item label="">
                                    <el-button style="width: 250px" @click="enterServerStorageKey">Ввести ключ доступа</el-button>
                            </el-form-item>
                            <el-form-item label="">
                                    <el-button style="width: 250px" @click="generateServerStorageKey">Сгенерировать новый ключ</el-button>
                            </el-form-item>

                            <el-form-item label="">
                                <div class="text">
                                    Рекомендуется сохранить ключ в надежном месте, чтобы всегда иметь возможность восстановить настройки,
                                    например, после переустановки ОС или чистки/смены браузера.<br>
                                    <b>ПРЕДУПРЕЖДЕНИЕ!</b> При утере ключа, НИКТО не сможет восстановить ваши настройки, т.к. все данные сжимаются
                                    и шифруются ключом доступа перед отправкой на сервер.
                                </div>
                            </el-form-item>
                        </el-form>
                    </el-tab-pane>
                    <!-- Вид ------------------------------------------------------------------------->                    
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
                                <el-input-number v-model="p" :min="0" :max="2000"></el-input-number>
                            </el-form-item>
                            <el-form-item label="Отступ">
                                <el-col :span="11">
                                    <el-tooltip :open-delay="500" effect="light">
                                        <template slot="content">
                                            Слева/справа
                                        </template>
                                        <el-input-number v-model="indentLR" :min="0" :max="2000"></el-input-number>
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
                                        <el-input-number v-model="indentTB" :min="0" :max="2000"></el-input-number>
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
                                <el-checkbox v-model="cutEmptyParagraphs">Убирать пустые строки</el-checkbox>
                            </el-form-item>
                            <el-form-item label="">
                                <el-col :span="12">
                                    Добавлять пустые
                                </el-col>
                                <el-input-number v-model="addEmptyParagraphs" :min="0" :max="2"></el-input-number>
                            </el-form-item>
                            
                            <el-form-item label="Изображения">
                                <el-col :span="11">
                                    <el-checkbox v-model="showImages">Показывать</el-checkbox>
                                </el-col>

                                <el-col :span="1">
                                    &nbsp;
                                </el-col>
                                <el-col :span="11">
                                    <el-tooltip :open-delay="500" effect="light" placement="top">
                                        <template slot="content">
                                            Выносить все изображения в центр экрана
                                        </template>
                                        <el-checkbox v-model="showInlineImagesInCenter" @change="needReload" :disabled="!showImages">Инлайн в центр</el-checkbox>
                                    </el-tooltip>
                                </el-col>
                            </el-form-item>
                            <el-form-item label="">
                                <el-checkbox v-model="imageFitWidth" :disabled="!showImages">Ширина не более размера экрана</el-checkbox>
                            </el-form-item>
                            <el-form-item label="">
                                    <el-col :span="12">
                                        Высота не более
                                    </el-col>
                                    <el-tooltip :open-delay="500" effect="light" placement="top">
                                        <template slot="content">
                                            Определяет высоту изображения количеством строк.<br>
                                            В случае превышения высоты, изображение будет<br>
                                            уменьшено с сохранением пропорций так, чтобы<br>
                                            помещаться в указанное количество строк.
                                        </template>
                                        <el-input-number v-model="imageHeightLines" :min="1" :max="100" :disabled="!showImages"></el-input-number>
                                    </el-tooltip>
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

                    <!-- Листание ------------------------------------------------------------------------->
                    <el-tab-pane label="Листание">
                        <el-form :model="form" size="mini" label-width="120px" @submit.native.prevent>
                            <div class="partHeader">Анимация</div>

                            <el-form-item label="Тип">
                                <el-col :span="11">
                                    <el-select v-model="pageChangeAnimation">
                                        <el-option label="Нет" value=""></el-option>
                                        <el-option label="Вверх-вниз" value="downShift"></el-option>
                                        <el-option label="Вправо-влево" value="rightShift"></el-option>
                                        <el-option label="Протаивание" value="thaw"></el-option>
                                        <el-option label="Мерцание" value="blink"></el-option>
                                    </el-select>
                                </el-col>
                            </el-form-item>

                            <el-form-item label="Скорость">
                                <el-input-number v-model="pageChangeAnimationSpeed" :min="0" :max="100" :disabled="pageChangeAnimation == ''"></el-input-number>
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
                    <!-- Прочее ------------------------------------------------------------------------->
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
                                    <el-checkbox v-model="showClickMapPage" :disabled="!clickControl">Показывать области управления кликом</el-checkbox>
                                </el-tooltip>
                            </el-form-item>
                            <el-form-item label="Подсказка">
                                <el-tooltip :open-delay="500" effect="light">
                                    <template slot="content">
                                        Мерцать сообщением в строке статуса и на кнопке<br>
                                        обновления при загрузке книги из кэша
                                    </template>
                                    <el-checkbox v-model="blinkCachedLoad">Предупреждать о загрузке из кэша</el-checkbox>
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
                    <!-- Сброс ------------------------------------------------------------------------->
                    <el-tab-pane label="Сброс">
                        <el-button @click="setDefaults">Установить по-умолчанию</el-button>
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
//import _ from 'lodash';

import {copyTextToClipboard} from '../../../share/utils';
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

    serverStorageKeyVisible = false;

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

    get mode() {
        return this.$store.state.config.mode;
    }

    get settings() {
        return this.$store.state.reader.settings;
    }

    get profiles() {
        return this.$store.state.reader.profiles;
    }

    get profilesArray() {
        return Object.keys(this.profiles);
    }

    get currentProfile() {
        return this.$store.state.reader.currentProfile;
    }

    set currentProfile(newValue) {
        this.commit('reader/setCurrentProfile', newValue);
    }

    get partialStorageKey() {
        return this.serverStorageKey.substr(0, 7) + '***';
    }

    get serverStorageKey() {
        return this.$store.state.reader.serverStorageKey;
    }

    get setStorageKeyLink() {
        return 'http://omnireader.ru/#/reader?setStorageKey=' + this.serverStorageKey;
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
          '#cfdc99',
          '#478355',
          '#a6caf0',
          '#909080',
          '#808080',
          '#c8c8c8',
        ];
    }

    needReload() {
        this.$notify.warning({message: 'Необходимо обновить страницу (F5), чтобы изменения возымели эффект'});
    }

    close() {
        this.$emit('settings-toggle');
    }

    async setDefaults() {
        try {
            if (await this.$confirm('Подтвердите установку настроек по-умолчанию:', '', {
                confirmButtonText: 'OK',
                cancelButtonText: 'Отмена',
                type: 'warning'
            })) {
                this.form = Object.assign({}, rstore.settingDefaults);
                for (let prop in rstore.settingDefaults) {
                    this[prop] = this.form[prop];
                }
            }
        } catch (e) {
            //
        }
    }

    async addProfile() {
        try {
            if (Object.keys(this.profiles).length >= 100) {
                this.$alert('Достигнут предел количества профилей', 'Ошибка');
                return;
            }
            const result = await this.$prompt('Введите произвольное название для профиля устройства:', '', {
                confirmButtonText: 'OK',
                cancelButtonText: 'Отмена',
                inputValidator: (str) => { if (!str) return 'Название не должно быть пустым'; else if (str.length > 50) return 'Слишком длинное название'; else return true; },
            });
            if (result.value) {
                if (this.profiles[result.value]) {
                    this.$alert('Такой профиль уже существует', 'Ошибка');
                } else {
                    this.currentProfile = result.value;
                    await this.$nextTick();//даем возможность обновить currentProfile
                    const newProfiles = Object.assign({}, this.profiles, {[result.value]: 1});
                    this.commit('reader/setProfiles', newProfiles);
                }
            }
        } catch (e) {
            //
        }
    }

    async delProfile() {
        if (!this.currentProfile)
            return;

        try {
            const result = await this.$prompt(`<b>Предупреждение!</b> Удаление профиля '${this.currentProfile}' необратимо.` +
                    `<br>Все настройки профиля будут потеряны,<br>однако список читаемых книг сохранится.` +
                    `<br><br>Введите 'да' для подтверждения удаления:`, '', {
                dangerouslyUseHTMLString: true,
                confirmButtonText: 'OK',
                cancelButtonText: 'Отмена',
                inputValidator: (str) => { if (str && str.toLowerCase() === 'да') return true; else return 'Удаление не подтверждено'; },
                type: 'warning'
            });

            if (result.value && result.value.toLowerCase() == 'да') {
                if (this.profiles[this.currentProfile]) {
                    const newProfiles = Object.assign({}, this.profiles);
                    delete newProfiles[this.currentProfile];
                    this.commit('reader/setProfiles', newProfiles);
                    await this.$nextTick();//даем возможность сохранить profiles
                    this.currentProfile = '';
                }
            }
        } catch (e) {
            //
        }
    }

    async delAllProfiles() {
        if (!Object.keys(this.profiles).length)
            return;

        try {
            const result = await this.$prompt(`<b>Предупреждение!</b> Удаление ВСЕХ профилей необратимо.` +
                    `<br><br>Введите 'да' для подтверждения удаления:`, '', {
                dangerouslyUseHTMLString: true,
                confirmButtonText: 'OK',
                cancelButtonText: 'Отмена',
                inputValidator: (str) => { if (str && str.toLowerCase() === 'да') return true; else return 'Удаление не подтверждено'; },
                type: 'warning'
            });

            if (result.value && result.value.toLowerCase() == 'да') {
                if (!this.currentProfile)
                    this.currentProfile = Object.keys(this.profiles)[0];
                await this.$nextTick();//даем возможность обновить currentProfile
                this.commit('reader/setProfiles', {});
                await this.$nextTick();//даем возможность сохранить profiles
                this.currentProfile = '';
            }
        } catch (e) {
            //
        }
    }

    async copyToClip(text, prefix) {
        const result = await copyTextToClipboard(text);
        const suf = (prefix.substr(-1) == 'а' ? 'а' : '');
        const msg = (result ? `${prefix} успешно скопирован${suf} в буфер обмена` : 'Копирование не удалось');
        if (result)
            this.$notify.success({message: msg});
        else
            this.$notify.error({message: msg});
    }

    async showServerStorageKey() {
        this.serverStorageKeyVisible = !this.serverStorageKeyVisible;
    }

    async enterServerStorageKey() {
    }

    async generateServerStorageKey() {
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

.text {
    font-size: 90%;
    line-height: 130%;
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

.center {
    text-align: center;
}
</style>