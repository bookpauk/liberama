<!---------------------------------------------->
<div class="hidden part-header">Цвет</div>

<div class="item row">
    <div class="label-2">Текст</div>
    <div class="col row">
        <q-input class="col-left-2 no-mp"
            outlined dense
            v-model="textColorFiltered"
            :rules="['hexColor']"
            style="max-width: 150px"
        >
            <template v-slot:prepend>
                <q-icon name="la la-angle-down la-xs" class="cursor-pointer text-white" :style="colorPanStyle('text')">
                    <q-popup-proxy anchor="bottom middle" self="top middle">
                        <div>
                            <q-color v-model="textColor"
                                no-header default-view="palette" :palette="predefineTextColors"
                            />
                        </div>
                    </q-popup-proxy>
                </q-icon>
            </template>
        </q-input>

        <span class="col" style="position: relative; top: 35px; left: 15px;">Обои:</span>
    </div>
</div>

<div class="q-mt-md"/>
<div class="item row">
    <div class="label-2">Фон</div>
    <div class="col row">
        <q-input class="col-left-2 no-mp"
            outlined dense
            v-model="bgColorFiltered"
            :rules="['hexColor']"
            style="max-width: 150px"
            :disable="wallpaper != ''"
        >
            <template v-slot:prepend>
                <q-icon name="la la-angle-down la-xs" class="cursor-pointer text-white" :style="colorPanStyle('bg')">
                    <q-popup-proxy anchor="bottom middle" self="top middle">
                        <div>
                            <q-color v-model="backgroundColor" no-header default-view="palette" :palette="predefineBackgroundColors"/>
                        </div>
                    </q-popup-proxy>
                </q-icon>
            </template>
        </q-input>

        <div class="q-px-sm"/>
        <q-select class="col" v-model="wallpaper" :options="wallpaperOptions"
            dropdown-icon="la la-angle-down la-sm"
            outlined dense emit-value map-options
        />
    </div>
</div>
