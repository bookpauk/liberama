<div class="part-header">Отображение</div>

<div class="item row no-wrap">
    <div class="label-3"></div>
    <q-checkbox size="xs" v-model="toolBarHideOnScroll" label="Скрывать/показывать панель при прокрутке" >
        <q-tooltip :delay="1000" anchor="top middle" self="bottom middle" content-style="font-size: 80%">
            Скрывать/показывть панель при прокрутке текста вперед/назад
        </q-tooltip>
    </q-checkbox>
</div>

<div class="part-header">Показывать кнопки</div>

<div class="item row no-wrap" v-for="item in toolButtons" :key="item.name" v-show="item.name != 'libs' || mode == 'liberama.top'">
    <div class="label-3"></div>
        <q-checkbox size="xs" v-model="showToolButton[item.name]" :label="rstore.readerActions[item.name]"
        />
</div>
