<div class="bg-grey-4 row">
    <q-tabs
        v-model="selectedKeysTab"
        active-color="black"
        active-bg-color="white"
        indicator-color="white"
        dense
        no-caps
        class="no-mp bg-grey-4 text-grey-7"
    >
        <q-tab name="mouse" label="Мышь/тачскрин" />
        <q-tab name="keyboard" label="Клавиатура" />
    </q-tabs>
</div>

<div class="q-mb-sm"/>

<div class="col tab-panel">
    <div v-if="selectedKeysTab == 'mouse'">
        <div class="item row">
            <div class="label-4"></div>
            <div class="col row">
                <q-checkbox size="xs" v-model="clickControl" label="Включить управление кликом" />
            </div>
        </div>
    </div>

    <div v-if="selectedKeysTab == 'keyboard'">
        <div class="item row">
            <UserHotKeys v-model="userHotKeys" />
        </div>
    </div>
</div>
