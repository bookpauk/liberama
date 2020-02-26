<div class="part-header">Показывать кнопки панели</div>

<div class="item row" v-for="item in toolButtons" :key="item.name">
    <div class="label-3"></div>
    <div class="col row">
        <q-checkbox size="xs" @input="changeShowToolButton(item.name)" :value="showToolButton[item.name]" :label="item.text" />
    </div>
</div>
