<div class="part-header">Цвет</div>

<div class="item row">
    <div class="label-2">Текст</div>
    <div class="col">
        <span style="position: relative; top: 20px;">Обои:</span>
    </div>
</div>

            <!--el-tab-pane label="Вид">

                <el-form :model="form" size="small" label-width="120px" @submit.native.prevent>
                    <div class="partHeader">Цвет</div>

                    <el-form-item label="Текст">
                        <el-col :span="12">
                            <el-color-picker v-model="textColor" color-format="hex" :predefine="predefineTextColors"></el-color-picker>
                            <span class="color-picked"><b>{{ textColor }}</b></span>
                        </el-col>
                        <el-col :span="5">
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
                    <el-form-item label="">
                        <el-col :span="12">
                            Компактность
                        </el-col>
                        <el-tooltip :open-delay="500" effect="light" placement="top">
                            <template slot="content">
                                Степень компактности текста в процентах.<br>
                                Чем больше компактность, тем хуже выравнивание<br>
                                по правому краю.
                            </template>
                            <el-input-number v-model="compactTextPerc" :min="0" :max="100"></el-input-number>
                        </el-tooltip>
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
                    <el-form-item label="">
                        <el-tooltip :open-delay="500" effect="light" placement="top">
                            <template slot="content">
                                Html-фильтр вырезает лишние элементы со<br>
                                страницы для определенных сайтов, таких как:<br>
                                samlib.ru<br>
                                www.fanfiction.net<br>
                                archiveofourown.org<br>
                                и других
                            </template>
                            <el-checkbox v-model="enableSitesFilter" @change="needTextReload">Включить html-фильтр для сайтов</el-checkbox>
                        </el-tooltip>
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
            </el-tab-pane-->
