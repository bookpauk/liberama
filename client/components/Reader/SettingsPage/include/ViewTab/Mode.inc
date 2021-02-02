<!---------------------------------------------->
<div class="hidden part-header">Режим</div>

<div class="item row">
    <div class="label-2"></div>
    <div class="col row">
        <q-checkbox v-model="dualPageMode" size="xs" label="Двухстраничный режим" />
    </div>
</div>

<div class="item row">
    <div class="label-2">Отступ</div>
    <div class="col row">
        <NumInput class="col-left" v-model="dualIndentLR" :min="0" :max="2000" :disable="!dualPageMode">
            <q-tooltip :delay="1000" anchor="top middle" self="bottom middle" content-style="font-size: 80%">
                Слева/справа внутри страницы
            </q-tooltip>
        </NumInput>
    </div>
</div>