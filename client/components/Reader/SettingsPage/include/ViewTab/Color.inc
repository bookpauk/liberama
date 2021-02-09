<!---------------------------------------------->
<div class="hidden part-header">Цвет</div>

<div class="item row">
    <div class="label-2">Текст</div>
    <div class="col row">
        <q-input class="col-left no-mp"
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
    </div>
</div>

<div class="q-mt-md"/>
<div class="item row">
    <div class="label-2">Фон</div>
    <div class="col row">
        <q-input class="col-left no-mp"
            outlined dense
            v-model="bgColorFiltered"
            :rules="['hexColor']"
            style="max-width: 150px"
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
    </div>
</div>

<div class="q-mt-md"/>
<div class="item row">
    <div class="label-2">Обои</div>
    <div class="col row items-center">
        <q-select class="col-left no-mp" v-model="wallpaper" :options="wallpaperOptions"
            dropdown-icon="la la-angle-down la-sm"
            outlined dense emit-value map-options
        >
            <template v-slot:selected-item="scope">
                <div >{{ scope.opt.label }}</div>
                <div v-show="scope.opt.value" class="q-ml-sm" :class="scope.opt.value" style="width: 50px; height: 30px;"></div>
            </template>

            <template v-slot:option="scope">
                <q-item
                    v-bind="scope.itemProps"
                    v-on="scope.itemEvents"
                >
                    <q-item-section>
                        <q-item-label v-html="scope.opt.label" />
                    </q-item-section>
                    <q-item-section v-show="scope.opt.value" :class="scope.opt.value" style="min-width: 70px; min-height: 50px"/>
                </q-item>
            </template>
        </q-select>

        <div class="q-px-xs"/>
        <q-btn class="q-ml-sm" round dense color="blue" icon="la la-plus" @click.stop="loadWallpaperFileClick">
            <q-tooltip :delay="1500" anchor="bottom middle" content-style="font-size: 80%">Добавить файл обоев</q-tooltip>
        </q-btn>
        <q-btn class="q-ml-sm" round dense color="blue" icon="la la-minus" @click.stop="delWallpaper" :disable="wallpaper.indexOf('user-paper') != 0">
            <q-tooltip :delay="1500" anchor="bottom middle" content-style="font-size: 80%">Удалить выбранные обои</q-tooltip>
        </q-btn>
    </div>
</div>

<input type="file" ref="file" @change="loadWallpaperFile" style='display: none;'/>
