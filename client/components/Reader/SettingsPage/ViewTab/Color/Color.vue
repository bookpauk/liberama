<template>
    <div class="fit sets-tab-panel">
        <!---------------------------------------------->
        <div class="hidden sets-part-header">
            Цвет
        </div>

        <div class="sets-item row">
            <div class="sets-label label">
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
                        <q-icon name="la la-angle-down la-xs" class="cursor-pointer text-white" :style="helper.colorPanStyle(form.textColor)">
                            <q-popup-proxy anchor="bottom middle" self="top middle">
                                <div>
                                    <q-color
                                        v-model="form.textColor"
                                        no-header default-view="palette" :palette="defPalette.predefineTextColors"
                                    />
                                </div>
                            </q-popup-proxy>
                        </q-icon>
                    </template>
                </q-input>
            </div>
        </div>

        <div class="q-mt-md" />
        <div class="sets-item row">
            <div class="sets-label label">
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
                        <q-icon name="la la-angle-down la-xs" class="cursor-pointer text-white" :style="helper.colorPanStyle(form.backgroundColor)">
                            <q-popup-proxy anchor="bottom middle" self="top middle">
                                <div>
                                    <q-color v-model="form.backgroundColor" no-header default-view="palette" :palette="defPalette.predefineBackgroundColors" />
                                </div>
                            </q-popup-proxy>
                        </q-icon>
                    </template>
                </q-input>
            </div>
        </div>

        <div class="q-mt-md" />
        <div class="sets-item row">
            <div class="sets-label label">
                Обои
            </div>
            <div class="col row items-center">
                <q-select 
                    v-model="form.wallpaper"
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
                                <q-item-label>
                                    {{ scope.opt.label }}
                                </q-item-label>
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
                <q-btn v-show="form.wallpaper.indexOf('user-paper') === 0" class="q-ml-sm" round dense color="blue" icon="la la-minus" @click.stop="delWallpaper">
                    <q-tooltip :delay="1500" anchor="bottom middle" content-style="font-size: 80%">
                        Удалить выбранные обои
                    </q-tooltip>
                </q-btn>
                <q-btn v-show="form.wallpaper.indexOf('user-paper') === 0" class="q-ml-sm" round dense color="blue" icon="la la-file-download" @click.stop="downloadWallpaper">
                    <q-tooltip :delay="1500" anchor="bottom middle" content-style="font-size: 80%">
                        Скачать выбранные обои
                    </q-tooltip>
                </q-btn>
            </div>
        </div>

        <div class="q-mt-sm" />
        <div class="sets-item row">
            <div class="sets-label label"></div>
            <div class="col row items-center">
                <q-checkbox v-model="form.wallpaperIgnoreStatusBar" size="xs" label="Не включать строку статуса в обои" />
            </div>
        </div>

        <input ref="file" type="file" style="display: none;" @change="loadWallpaperFile" />
        <a ref="download" style="display: none;" target="_blank"></a>
    </div>
</template>

<script>
//-----------------------------------------------------------------------------
import vueComponent from '../../../../vueComponent.js';

import _ from 'lodash';

import * as helper from '../helper';
import defPalette from '../defPalette';

import * as utils from '../../../../../share/utils';
import * as cryptoUtils from '../../../../../share/cryptoUtils';
import wallpaperStorage from '../../../share/wallpaperStorage';
import readerApi from '../../../../../api/reader';

const componentOptions = {
    components: {
    },
    watch: {
        form() {
            this.formChanged();//no await
        },
        textColorFiltered(newValue) {
            if (!this.isFormChanged && this.helper.isHexColor(newValue))
                this.form.textColor = newValue;
        },
        bgColorFiltered(newValue) {
            if (!this.isFormChanged && this.helper.isHexColor(newValue))
                this.form.backgroundColor = newValue;
        },
    },
};
class Color {
    _options = componentOptions;
    _props = {
        form: Object,
    };

    helper = helper;
    defPalette = defPalette;

    isFormChanged = false;
    textColorFiltered = '';
    bgColorFiltered = '';

    created() {
        this.formChanged();//no await
    }

    mounted() {
    }

    async formChanged() {
        this.isFormChanged = true;
        try {
            this.textColorFiltered = this.form.textColor;
            this.bgColorFiltered = this.form.backgroundColor;

            if (this.form.wallpaper != '' && this.form.pageChangeAnimation == 'flip')
                this.form.pageChangeAnimation = '';
        } finally {
            await this.$nextTick();
            this.isFormChanged = false;
        }
    }

    get wallpaperOptions() {
        let result = [{label: 'Нет', value: ''}];

        const userWallpapers = _.cloneDeep(this.form.userWallpapers);
        userWallpapers.sort((a, b) => a.label.localeCompare(b.label));

        for (const wp of userWallpapers) {
            if (wallpaperStorage.keyExists(wp.cssClass))
                result.push({label: wp.label, value: wp.cssClass});
        }

        for (let i = 1; i <= 17; i++) {
            result.push({label: i, value: `paper${i}`});
        }

        return result;
    }

    loadWallpaperFileClick() {
        this.$refs.file.click();
    }

    loadWallpaperFile() {
        const file = this.$refs.file.files[0];        
        if (file.size > 10*1024*1024) {
            this.$root.stdDialog.alert('Файл обоев не должен превышать в размере 10Mb', 'Ошибка');
            return;
        }

        if (file.type != 'image/png' && file.type != 'image/jpeg') {
            this.$root.stdDialog.alert('Файл обоев должен иметь тип PNG или JPEG', 'Ошибка');
            return;
        }

        if (this.form.userWallpapers.length >= 100) {
            this.$root.stdDialog.alert('Превышено максимальное количество пользовательских обоев.', 'Ошибка');
            return;
        }

        this.$refs.file.value = '';
        if (file) {
            const reader = new FileReader();

            reader.onload = (e) => {
                (async() => {
                    const data = e.target.result;
                    const key = utils.toHex(cryptoUtils.sha256(data));
                    const label = `#${key.substring(0, 4)}`;
                    const cssClass = `user-paper${key}`;

                    const newUserWallpapers = _.cloneDeep(this.form.userWallpapers);
                    const index = _.findIndex(newUserWallpapers, (item) => (item.cssClass == cssClass));

                    if (index < 0)
                        newUserWallpapers.push({label, cssClass});
                    if (!wallpaperStorage.keyExists(cssClass)) {
                        await wallpaperStorage.setData(cssClass, data);
                        //отправим data на сервер в файл `/upload/${key}`
                        try {
                            //const res = 
                            await readerApi.uploadFileBuf(data);
                            //console.log(res);
                        } catch (e) {
                            console.error(e);
                        }
                    }

                    this.form.userWallpapers = newUserWallpapers;
                    this.form.wallpaper = cssClass;
                })();
            }

            reader.readAsDataURL(file);
        }
    }

    async delWallpaper() {
        if (this.form.wallpaper.indexOf('user-paper') == 0) {
            const newUserWallpapers = [];
            for (const wp of this.form.userWallpapers) {
                if (wp.cssClass != this.form.wallpaper) {
                    newUserWallpapers.push(wp);
                }
            }

            await wallpaperStorage.removeData(this.form.wallpaper);

            this.form.userWallpapers = newUserWallpapers;
            this.form.wallpaper = '';
        }
    }

    async downloadWallpaper() {
        if (this.form.wallpaper.indexOf('user-paper') != 0)
            return;

        try {
            const d = this.$refs.download;

            const dataUrl = await wallpaperStorage.getData(this.form.wallpaper);

            if (!dataUrl)
                throw new Error('Файл обоев не найден');

            d.href = dataUrl;
            d.download = `wallpaper-#${this.form.wallpaper.replace('user-paper', '').substring(0, 4)}`;

            d.click();
        } catch (e) {
            this.$root.stdDialog.alert(e.message, 'Ошибка', {color: 'negative'});
        }
    }
}

export default vueComponent(Color);
//-----------------------------------------------------------------------------
</script>

<style scoped>
.label {
    width: 110px;
}

.col-left {
    width: 150px;
}

.no-mp {
    margin: 0;
    padding: 0;
}
</style>
