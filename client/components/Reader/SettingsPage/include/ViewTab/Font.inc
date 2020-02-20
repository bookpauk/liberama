<!---------------------------------------------->
<div class="hidden part-header">Шрифт</div>

<div class="item row">
    <div class="label-2">Локальный/веб</div>
    <div class="col row">
        <q-select class="col-left" v-model="fontName" :options="fontsOptions" :disable="webFontName != ''"
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
        <NumInput class="col-left" v-model="fontSize" :min="5" :max="200"/>

        <div class="col q-pt-xs text-right">
            <a href="https://fonts.google.com/?subset=cyrillic" target="_blank">Примеры</a>
        </div>
    </div>
</div>

<div class="item row">
    <div class="label-2">Сдвиг</div>
    <div class="col row">
        <NumInput class="col-left" v-model="vertShift" :min="-100" :max="100">
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
