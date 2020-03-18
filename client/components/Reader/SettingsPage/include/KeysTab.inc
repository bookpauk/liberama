<div class="part-header">Управление</div>

<div class="item row">
    <div class="label-4"></div>
    <div class="col row">
        <q-checkbox size="xs" v-model="clickControl" label="Включить управление кликом" />
    </div>
</div>

<div class="item row">
    <UserHotKeys v-model="userHotKeys" />
</div>