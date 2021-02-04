<!---------------------------------------------->
<div class="hidden part-header">Текст</div>

<div class="item row">
    <div class="label-2">Интервал</div>
    <div class="col row">
        <NumInput class="col-left" v-model="lineInterval" :min="0" :max="200"/>
    </div>
</div>

<div class="item row">
    <div class="label-2">Параграф</div>
    <div class="col row">
        <NumInput class="col-left" v-model="p" :min="0" :max="2000"/>
    </div>
</div>

<div class="item row">
    <div class="label-2">Отступ</div>
    <div class="col row">
        <NumInput class="col-left" v-model="indentLR" :min="0" :max="2000">
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
        <NumInput class="col-left" v-model="textVertShift" :min="-100" :max="100">
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
        <NumInput class="col-left" v-model="scrollingDelay" :min="1" :max="10000">
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
    <div class="col-left column justify-center text-right">
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
    <div class="col-left column justify-center text-right">
        Добавлять пустые
    </div>
    <div class="q-px-sm"/>
    <NumInput class="col" v-model="addEmptyParagraphs" :min="0" :max="2"/>
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
        <q-checkbox v-model="imageFitWidth" size="xs" label="Ширина не более размера страницы" :disable="!showImages || dualPageMode"/>
    </div>
</div>

<div class="item row">
    <div class="label-2"></div>
    <div class="col-left column justify-center text-right">
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
