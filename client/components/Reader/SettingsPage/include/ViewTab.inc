<!---------------------------------------------->
<div class="part-header">Цвет</div>

<div class="item row">
    <div class="label-2">Текст</div>
    <div class="col row">
        <div class="col-left-2">
            <q-input
                outlined dense
                v-model="textColorFiltered"
                :rules="['hexColor']"
                class="no-mp"
                style="max-width: 150px"
            >
                <template v-slot:prepend>
                    <q-icon name="la la-angle-down la-xs" class="cursor-pointer text-white" :style="colorPanStyle('text')">
                        <q-popup-proxy anchor="bottom middle" self="top middle">
                            <div>
                                <q-color v-model="textColor"
                                    no-header default-view="palette" :palette="predefineTextColors"
                                />
                            </div>
                        </q-popup-proxy>
                    </q-icon>
                </template>
            </q-input>
        </div>

        <span class="col" style="position: relative; top: 35px; left: 15px;">Обои:</span>
    </div>
</div>

<div class="q-mt-md"/>
<div class="item row">
    <div class="label-2">Фон</div>
    <div class="col row">
        <div class="col-left-2">
            <q-input
                outlined dense
                v-model="bgColorFiltered"
                :rules="['hexColor']"
                class="no-mp"
                style="max-width: 150px"
                :disable="wallpaper != ''"
            >
                <template v-slot:prepend>
                    <q-icon name="la la-angle-down la-xs" class="cursor-pointer text-white" :style="colorPanStyle('bg')">
                        <q-popup-proxy anchor="bottom middle" self="top middle">
                            <div>
                                <q-color v-model="backgroundColor" no-header default-view="palette" :palette="predefineBackgroundColors"/>
                            </div>
                        </q-popup-proxy>
                    </q-icon>
                </template>
            </q-input>
        </div>

        <div class="q-px-sm"/>
        <q-select class="col" v-model="wallpaper" :options="wallpaperOptions"
            dropdown-icon="la la-angle-down la-sm"
            outlined dense emit-value map-options
        />
    </div>
</div>

<!---------------------------------------------->
<div class="part-header">Шрифт</div>

<div class="item row">
    <div class="label-2">Локальный/веб</div>
    <div class="col row">
        <div class="col-left-2">
            <q-select class="col" v-model="fontName" :options="fontsOptions" :disable="webFontName != ''"
                dropdown-icon="la la-angle-down la-sm"
                outlined dense emit-value map-options
            />
        </div>

        <div class="q-px-sm"/>
        <q-select class="col" v-model="webFontName" :options="webFontsOptions"
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

<div class="item row">
    <div class="label-2">Размер</div>
    <div class="col row">
        <div class="col-left-2">
            <NumInput v-model="fontSize" :min="5" :max="200"/>
        </div>

        <div class="col q-pt-xs" style="text-align: right">
            <a href="https://fonts.google.com/?subset=cyrillic" target="_blank">Примеры</a>
        </div>
    </div>
</div>

<div class="item row">
    <div class="label-2">Сдвиг</div>
    <div class="col row">
        <div class="col-left-2">
            <NumInput v-model="vertShift" :min="-100" :max="100">
                <q-tooltip :delay="1000" anchor="top middle" self="bottom middle" content-style="font-size: 80%">
                    Сдвиг шрифта по вертикали в процентах от размера.<br>
                    Отрицательное значение сдвигает вверх, положительное -<br>
                    вниз. Значение зависит от метрики шрифта.
                </q-tooltip>
            </NumInput>
        </div>
    </div>
</div>

<div class="item row">
    <div class="label-2">Стиль</div>
    <div class="col row">
        <q-checkbox v-model="fontBold" size="xs" label="Жирный" />
        <q-checkbox class="q-ml-sm" v-model="fontItalic" size="xs" label="Курсив" />
    </div>
</div>

<!---------------------------------------------->
<div class="part-header">Текст</div>

<div class="item row">
    <div class="label-2">Интервал</div>
    <div class="col row">
        <div class="col-left-2">
            <NumInput v-model="lineInterval" :min="0" :max="200"/>
        </div>
    </div>
</div>

<div class="item row">
    <div class="label-2">Параграф</div>
    <div class="col row">
        <div class="col-left-2">
            <NumInput v-model="p" :min="0" :max="2000"/>
        </div>
    </div>
</div>

<div class="item row">
    <div class="label-2">Отступ</div>
    <div class="col row">
        <div class="col-left-2">
            <NumInput v-model="indentLR" :min="0" :max="2000">
                <q-tooltip :delay="1000" anchor="top middle" self="bottom middle" content-style="font-size: 80%">
                    Слева/справа
                </q-tooltip>
            </NumInput>
        </div>
        <div class="q-px-sm"/>
        <div class="col">
            <NumInput v-model="indentTB" :min="0" :max="2000">
                <q-tooltip :delay="1000" anchor="top middle" self="bottom middle" content-style="font-size: 80%">
                    Слева/справа
                </q-tooltip>
            </NumInput>
        </div>
    </div>
</div>
<!--

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
