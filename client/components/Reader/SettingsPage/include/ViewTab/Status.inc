<!---------------------------------------------->
<div class="hidden part-header">Строка статуса</div>

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
        <NumInput class="col-left" v-model="statusBarHeight" :min="5" :max="100" :disable="!showStatusBar"/>
    </div>
</div>

<div class="item row">
    <div class="label-2">Прозрачность</div>
    <div class="col row">
        <NumInput class="col-left" v-model="statusBarColorAlpha" :min="0" :max="1" :digits="2" :step="0.1" :disable="!showStatusBar"/>
    </div>
</div>

<div class="item row">
    <div class="label-2"></div>
    <div class="col row">
        <q-checkbox v-model="statusBarClickOpen" size="xs" label="Открывать оригинал по клику">
            <q-tooltip :delay="1000" anchor="top middle" self="bottom middle" content-style="font-size: 80%">
                По клику на автора-название в строке статуса<br>
                открывать оригинал произведения в новой вкладке
            </q-tooltip>
        </q-checkbox>
    </div>
</div>
