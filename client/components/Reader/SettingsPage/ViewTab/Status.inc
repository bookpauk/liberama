<!---------------------------------------------->
<div class="hidden part-header">Строка статуса</div>

<div class="item row">
    <div class="label-2">Статус</div>
    <div class="col row">
        <q-checkbox v-model="showStatusBar" size="xs" label="Показывать" />
        <q-checkbox v-show="showStatusBar" class="q-ml-sm" v-model="statusBarTop" size="xs" label="Вверху/внизу" />
    </div>
</div>

<div v-show="showStatusBar" class="item row no-wrap">
    <div class="label-2">Цвет</div>
    <div class="col-left row">
        <q-input class="col-left no-mp"
            outlined dense
            v-model="statusBarColorFiltered"
            :rules="['hexColor']"
            style="max-width: 150px"
            :disable="statusBarColorAsText"
        >
            <template v-slot:prepend>
                <q-icon name="la la-angle-down la-xs" class="cursor-pointer text-white" :style="colorPanStyle('statusbar')">
                    <q-popup-proxy anchor="bottom middle" self="top middle">
                        <div>
                            <q-color v-model="statusBarColor"
                                no-header default-view="palette" :palette="predefineTextColors"
                            />
                        </div>
                    </q-popup-proxy>
                </q-icon>
            </template>
        </q-input>
    </div>
    
    <div class="q-px-xs"/>
    <q-checkbox v-model="statusBarColorAsText" size="xs" label="Как у текста"/>
</div>

<div v-show="showStatusBar" class="item row">
    <div class="label-2">Прозрачность</div>
    <div class="col row">
        <NumInput class="col-left" v-model="statusBarColorAlpha" :min="0" :max="1" :digits="2" :step="0.1"/>
    </div>
</div>

<div v-show="showStatusBar" class="item row">
    <div class="label-2">Высота</div>
    <div class="col row">
        <NumInput class="col-left" v-model="statusBarHeight" :min="5" :max="100"/>
    </div>
</div>

<div v-show="showStatusBar" class="item row">
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
