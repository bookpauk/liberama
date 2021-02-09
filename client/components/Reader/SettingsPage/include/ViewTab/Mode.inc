<!---------------------------------------------->
<div class="hidden part-header">Режим</div>

<div class="item row">
    <div class="label-2"></div>
    <div class="col row">
        <q-checkbox v-model="dualPageMode" size="xs" label="Двухстраничный режим" />
    </div>
</div>

<div class="part-header">Страницы</div>
<div class="item row">
    <div class="label-2">Отступ границ</div>
    <div class="col row">
        <NumInput class="col-left" v-model="indentLR" :min="0" :max="2000">
            <q-tooltip :delay="1000" anchor="top middle" self="bottom middle" content-style="font-size: 80%">
                Слева/справа от края экрана
            </q-tooltip>
        </NumInput>
        <div class="q-px-sm"/>
        <NumInput class="col" v-model="indentTB" :min="0" :max="2000">
            <q-tooltip :delay="1000" anchor="top middle" self="bottom middle" content-style="font-size: 80%">
                Сверху/снизу от края экрана
            </q-tooltip>
        </NumInput>
    </div>
</div>

<div v-show="dualPageMode" class="item row">
    <div class="label-2">Отступ внутри</div>
    <div class="col row">
        <NumInput class="col-left" v-model="dualIndentLR" :min="0" :max="2000">
            <q-tooltip :delay="1000" anchor="top middle" self="bottom middle" content-style="font-size: 80%">
                Слева/справа внутри страницы
            </q-tooltip>
        </NumInput>
    </div>
</div>

<div v-show="dualPageMode">
    <div class="part-header">Разделитель</div>
    <div class="item row">
        <div class="label-2">Ширина (px)</div>
        <div class="col row">
            <NumInput class="col-left" v-model="dualDivWidth" :min="0" :max="100">
                <q-tooltip :delay="1000" anchor="top middle" self="bottom middle" content-style="font-size: 80%">
                    Ширина разделителя
                </q-tooltip>
            </NumInput>
        </div>
    </div>

    <div class="item row">
        <div class="label-2">Высота (%)</div>
        <div class="col row">
            <NumInput class="col-left" v-model="dualDivHeight" :min="0" :max="100">
                <q-tooltip :delay="1000" anchor="top middle" self="bottom middle" content-style="font-size: 80%">
                    Высота разделителя
                </q-tooltip>
            </NumInput>
        </div>
    </div>

    <div class="item row">
        <div class="label-2">Прозрачность</div>
        <div class="col row">
            <NumInput class="col-left" v-model="dualDivColorAlpha" :min="0" :max="1" :digits="2" :step="0.1"/>
        </div>
    </div>

    <div class="item row">
        <div class="label-2">Заполнение</div>
        <div class="col row">
            <NumInput class="col-left" v-model="dualDivStrokeFill" :min="0" :max="2000">
                <q-tooltip :delay="1000" anchor="top middle" self="bottom middle" content-style="font-size: 80%">
                    Заполнение пунктира
                </q-tooltip>
            </NumInput>
        </div>
    </div>

    <div class="item row">
        <div class="label-2">Промежуток</div>
        <div class="col row">
            <NumInput class="col-left" v-model="dualDivStrokeGap" :min="0" :max="2000">
                <q-tooltip :delay="1000" anchor="top middle" self="bottom middle" content-style="font-size: 80%">
                    Промежуток пунктира
                </q-tooltip>
            </NumInput>
        </div>
    </div>

    <div class="item row">
        <div class="label-2">Ширина тени</div>
        <div class="col row">
            <NumInput class="col-left" v-model="dualDivShadowWidth" :min="0" :max="100"/>
        </div>
    </div>    

</div>