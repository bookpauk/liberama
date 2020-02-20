<!---------------------------------------------->
<div class="part-header">Цвет</div>

<div class="item row">
    <div class="label-2">Текст</div>
    <div class="col row">
        <q-input class="col-left-2 no-mp"
            outlined dense
            v-model="textColorFiltered"
            :rules="['hexColor']"
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

        <span class="col" style="position: relative; top: 35px; left: 15px;">Обои:</span>
    </div>
</div>

<div class="q-mt-md"/>
<div class="item row">
    <div class="label-2">Фон</div>
    <div class="col row">
        <q-input class="col-left-2 no-mp"
            outlined dense
            v-model="bgColorFiltered"
            :rules="['hexColor']"
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
        <q-select class="col-left-2" v-model="fontName" :options="fontsOptions" :disable="webFontName != ''"
            dropdown-icon="la la-angle-down la-sm"
            outlined dense emit-value map-options
        />

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
        <NumInput class="col-left-2" v-model="fontSize" :min="5" :max="200"/>

        <div class="col q-pt-xs text-right">
            <a href="https://fonts.google.com/?subset=cyrillic" target="_blank">Примеры</a>
        </div>
    </div>
</div>

<div class="item row">
    <div class="label-2">Сдвиг</div>
    <div class="col row">
        <NumInput class="col-left-2" v-model="vertShift" :min="-100" :max="100">
            <q-tooltip :delay="1000" anchor="top middle" self="bottom middle" content-style="font-size: 80%">
                Сдвиг шрифта по вертикали в процентах от размера.<br>
                Отрицательное значение сдвигает вверх, положительное -<br>
                вниз. Значение зависит от метрики шрифта.
            </q-tooltip>
        </NumInput>
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
        <NumInput class="col-left-2" v-model="lineInterval" :min="0" :max="200"/>
    </div>
</div>

<div class="item row">
    <div class="label-2">Параграф</div>
    <div class="col row">
        <NumInput class="col-left-2" v-model="p" :min="0" :max="2000"/>
    </div>
</div>

<div class="item row">
    <div class="label-2">Отступ</div>
    <div class="col row">
        <NumInput class="col-left-2" v-model="indentLR" :min="0" :max="2000">
            <q-tooltip :delay="1000" anchor="top middle" self="bottom middle" content-style="font-size: 80%">
                Слева/справа
            </q-tooltip>
        </NumInput>
        <div class="q-px-sm"/>
        <NumInput class="col" v-model="indentTB" :min="0" :max="2000">
            <q-tooltip :delay="1000" anchor="top middle" self="bottom middle" content-style="font-size: 80%">
                Сверху/снизу
            </q-tooltip>
        </NumInput>
    </div>
</div>

<div class="item row">
    <div class="label-2">Сдвиг</div>
    <div class="col row">
        <NumInput class="col-left-2" v-model="textVertShift" :min="-100" :max="100">
            <q-tooltip :delay="1000" anchor="top middle" self="bottom middle" content-style="font-size: 80%">
                Сдвиг текста по вертикали в процентах от размера шрифта.<br>
                Отрицательное значение сдвигает вверх, положительное -<br>
                вниз.
            </q-tooltip>
        </NumInput>
    </div>
</div>

<div class="item row">
    <div class="label-2">Скроллинг</div>
    <div class="col row">
        <NumInput class="col-left-2" v-model="scrollingDelay" :min="1" :max="10000">
            <q-tooltip :delay="1000" anchor="top middle" self="bottom middle" content-style="font-size: 80%">
                Замедление скроллинга в миллисекундах.<br>
                Определяет время, за которое текст<br>
                прокручивается на одну строку.
            </q-tooltip>
        </NumInput>

        <div class="q-px-sm"/>
        <q-select class="col" v-model="scrollingType" :options="['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out']"
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

<div class="item row">
    <div class="label-2">Выравнивание</div>
    <div class="col row">
        <q-checkbox v-model="textAlignJustify" size="xs" label="По ширине" />
        <q-checkbox class="q-ml-sm" v-model="wordWrap" size="xs" label="Перенос по слогам" />
    </div>
</div>

<div class="item row">
    <div class="label-2"></div>
    <div class="col-left-2 column justify-center text-right">
        Компактность
    </div>
    <div class="q-px-sm"/>
    <NumInput class="col" v-model="compactTextPerc" :min="0" :max="100">
        <q-tooltip :delay="1000" anchor="top middle" self="bottom middle" content-style="font-size: 80%">
            Степень компактности текста в процентах.<br>
            Чем больше компактность, тем хуже выравнивание<br>
            по правому краю.
        </q-tooltip>
    </NumInput>
</div>

<div class="item row">
    <div class="label-2">Обработка</div>
    <div class="col row">
        <q-checkbox v-model="cutEmptyParagraphs" size="xs" label="Убирать пустые строки" />
    </div>
</div>

<div class="item row">
    <div class="label-2"></div>
    <div class="col-left-2 column justify-center text-right">
        Добавлять пустые
    </div>
    <div class="q-px-sm"/>
    <NumInput class="col" v-model="addEmptyParagraphs" :min="0" :max="2"/>
</div>

<div class="item row">
    <div class="label-2"></div>
    <div class="col row">
        <q-checkbox v-model="enableSitesFilter" @input="needTextReload" size="xs" label="Включить html-фильтр для сайтов">
            <q-tooltip :delay="1000" anchor="top middle" self="bottom middle" content-style="font-size: 80%">
                Html-фильтр вырезает лишние элементы со<br>
                страницы для определенных сайтов, таких как:<br>
                samlib.ru<br>
                www.fanfiction.net<br>
                archiveofourown.org<br>
                и других
            </q-tooltip>
        </q-checkbox>
    </div>
</div>

<div class="item row">
    <div class="label-2">Изображения</div>
    <div class="col row">
        <q-checkbox v-model="showImages" size="xs" label="Показывать" />
        <q-checkbox class="q-ml-sm" v-model="showInlineImagesInCenter" @input="needReload" :disable="!showImages" size="xs" label="Инлайн в центр">
            <q-tooltip :delay="1000" anchor="top middle" self="bottom middle" content-style="font-size: 80%">
                Выносить все изображения в центр экрана
            </q-tooltip>
        </q-checkbox>
    </div>
</div>

<div class="item row">
    <div class="label-2"></div>
    <div class="col row">
        <q-checkbox v-model="imageFitWidth" :disable="!showImages" size="xs" label="Ширина не более размера экрана" />
    </div>
</div>

<div class="item row">
    <div class="label-2"></div>
    <div class="col-left-2 column justify-center text-right">
        Высота не более
    </div>
    <div class="q-px-sm"/>
    <NumInput class="col" v-model="imageHeightLines" :min="1" :max="100" :disable="!showImages">
        <q-tooltip :delay="1000" anchor="top middle" self="bottom middle" content-style="font-size: 80%">
            Определяет высоту изображения количеством строк.<br>
            В случае превышения высоты, изображение будет<br>
            уменьшено с сохранением пропорций так, чтобы<br>
            помещаться в указанное количество строк.
        </q-tooltip>
    </NumInput>
</div>

<!---------------------------------------------->
<div class="part-header">Строка статуса</div>

<div class="item row">
    <div class="label-2">Статус</div>
    <div class="col row">
        <q-checkbox v-model="showStatusBar" size="xs" label="Показывать" />
        <q-checkbox class="q-ml-sm" v-model="statusBarTop" size="xs" :disable="!showStatusBar" label="Вверху/внизу" />
    </div>
</div>

<div class="item row">
    <div class="label-2">Высота</div>
    <div class="col row">
        <NumInput class="col-left-2" v-model="statusBarHeight" :min="5" :max="100" :disable="!showStatusBar"/>
    </div>
</div>

<div class="item row">
    <div class="label-2">Прозрачность</div>
    <div class="col row">
        <NumInput class="col-left-2" v-model="statusBarColorAlpha" :min="0" :max="1" :digits="2" :step="0.1" :disable="!showStatusBar"/>
    </div>
</div>
