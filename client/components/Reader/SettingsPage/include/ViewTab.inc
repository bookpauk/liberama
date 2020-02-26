<q-tabs
    v-model="selectedViewTab"
    active-color="black"
    active-bg-color="white"
    indicator-color="white"
    dense
    no-caps
    class="no-mp bg-grey-3 text-grey-7"
>
    <q-tab name="color" label="Цвет" />
    <q-tab name="font" label="Шрифт" />
    <q-tab name="text" label="Текст" />
    <q-tab name="status" label="Строка статуса" />
</q-tabs>

<div class="q-mb-sm"/>

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