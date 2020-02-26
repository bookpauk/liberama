<!---------------------------------------------->
<div class="part-header">Анимация</div>

<div class="item row">
    <div class="label-5">Тип</div>
    <q-select class="col-left" v-model="pageChangeAnimation" :options="pageChangeAnimationOptions"
        dropdown-icon="la la-angle-down la-sm"
        outlined dense emit-value map-options
    />
</div>

<div class="item row">
    <div class="label-5">Скорость</div>
    <NumInput class="col-left" v-model="pageChangeAnimationSpeed" :min="0" :max="100" :disable="pageChangeAnimation == ''"/>
</div>

<!---------------------------------------------->
<div class="part-header">Другое</div>

<div class="item row">
    <div class="label-5">Страница</div>
    <q-checkbox v-model="keepLastToFirst" size="xs" label="Переносить последнюю строку">
        <q-tooltip :delay="1000" anchor="top middle" self="bottom middle" content-style="font-size: 80%">
            Переносить последнюю строку страницы<br>
            в начало следующей при листании
        </q-tooltip>
    </q-checkbox>
</div>
