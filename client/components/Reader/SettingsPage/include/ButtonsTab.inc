<div class="part-header">Показывать кнопки панели</div>

<div class="item row" v-for="item in toolButtons" :key="item.name" v-show="item.name != 'libs' || mode == 'liberama.top'">
    <div class="label-3"></div>
    <div class="col row">
        <q-checkbox size="xs" v-model="showToolButton[item.name]" :label="rstore.readerActions[item.name]"
        />
    </div>
</div>
