<q-tabs
    v-model="selectedViewTab"
    active-bg-color="grey-5"
    indicator-color="white"
    dense
    no-caps
    class="no-mp"
>
    <q-tab name="color" label="Цвет" />
    <q-tab name="font" label="Шрифт" />
    <q-tab name="text" label="Текст" />
    <q-tab name="status" label="Строка статуса" />
</q-tabs>

<div class="bg-grey-8 q-mb-sm" style="height: 2px; position: relative; top: -2px;"/>

<div class="col tab-panel">
    <div v-if="selectedViewTab == 'color'">
        @@include('./ViewTab/Color.inc');
    </div>

    <div v-if="selectedViewTab == 'font'">
        @@include('./ViewTab/Font.inc');
    </div>

    <div v-if="selectedViewTab == 'text'">
        @@include('./ViewTab/Text.inc');
    </div>

    <div v-if="selectedViewTab == 'status'">
        @@include('./ViewTab/Status.inc');
    </div>
</div>