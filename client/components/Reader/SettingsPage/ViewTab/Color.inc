                            <!---------------------------------------------->
                            <div class="hidden part-header">
                                Цвет
                            </div>

                            <div class="item row">
                                <div class="label-2">
                                    Текст
                                </div>
                                <div class="col row">
                                    <q-input
                                        v-model="textColorFiltered"
                                        class="col-left no-mp"
                                        outlined dense
                                        
                                        :rules="['hexColor']"
                                        style="max-width: 150px"
                                    >
                                        <template #prepend>
                                            <q-icon name="la la-angle-down la-xs" class="cursor-pointer text-white" :style="colorPanStyle('text')">
                                                <q-popup-proxy anchor="bottom middle" self="top middle">
                                                    <div>
                                                        <q-color
                                                            v-model="textColor"
                                                            no-header default-view="palette" :palette="predefineTextColors"
                                                        />
                                                    </div>
                                                </q-popup-proxy>
                                            </q-icon>
                                        </template>
                                    </q-input>
                                </div>
                            </div>

                            <div class="q-mt-md" />
                            <div class="item row">
                                <div class="label-2">
                                    Фон
                                </div>
                                <div class="col row">
                                    <q-input 
                                        v-model="bgColorFiltered"
                                        class="col-left no-mp"
                                        outlined dense
                                        
                                        :rules="['hexColor']"
                                        style="max-width: 150px"
                                    >
                                        <template #prepend>
                                            <q-icon name="la la-angle-down la-xs" class="cursor-pointer text-white" :style="colorPanStyle('bg')">
                                                <q-popup-proxy anchor="bottom middle" self="top middle">
                                                    <div>
                                                        <q-color v-model="backgroundColor" no-header default-view="palette" :palette="predefineBackgroundColors" />
                                                    </div>
                                                </q-popup-proxy>
                                            </q-icon>
                                        </template>
                                    </q-input>
                                </div>
                            </div>

                            <div class="q-mt-md" />
                            <div class="item row">
                                <div class="label-2">
                                    Обои
                                </div>
                                <div class="col row items-center">
                                    <q-select 
                                        v-model="wallpaper"
                                        class="col-left no-mp"
                                        :options="wallpaperOptions"
                                        dropdown-icon="la la-angle-down la-sm"
                                        outlined dense emit-value map-options
                                    >
                                        <template #selected-item="scope">
                                            <div>
                                                {{ scope.opt.label }}
                                            </div>
                                            <div v-show="scope.opt.value" class="q-ml-sm" :class="scope.opt.value" style="width: 40px; height: 28px;"></div>
                                        </template>

                                        <template #option="scope">
                                            <q-item
                                                v-bind="scope.itemProps"
                                            >
                                                <q-item-section style="min-width: 50px;">
                                                    <q-item-label v-html="scope.opt.label" />
                                                </q-item-section>
                                                <q-item-section v-show="scope.opt.value" :class="scope.opt.value" style="min-width: 70px; min-height: 50px;" />
                                            </q-item>
                                        </template>
                                    </q-select>

                                    <div class="q-px-xs" />
                                    <q-btn class="q-ml-sm" round dense color="blue" icon="la la-plus" @click.stop="loadWallpaperFileClick">
                                        <q-tooltip :delay="1500" anchor="bottom middle" content-style="font-size: 80%">
                                            Добавить файл обоев
                                        </q-tooltip>
                                    </q-btn>
                                    <q-btn v-show="wallpaper.indexOf('user-paper') === 0" class="q-ml-sm" round dense color="blue" icon="la la-minus" @click.stop="delWallpaper">
                                        <q-tooltip :delay="1500" anchor="bottom middle" content-style="font-size: 80%">
                                            Удалить выбранные обои
                                        </q-tooltip>
                                    </q-btn>
                                </div>
                            </div>

                            <div class="q-mt-sm" />
                            <div class="item row">
                                <div class="label-2"></div>
                                <div class="col row items-center">
                                    <q-checkbox v-model="wallpaperIgnoreStatusBar" size="xs" label="Не включать строку статуса в обои" />
                                </div>
                            </div>

                            <input ref="file" type="file" style="display: none;" @change="loadWallpaperFile" />
