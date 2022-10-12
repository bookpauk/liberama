<template>
    <Window ref="window" width="600px" @close="close">
        <template #header>
            Настройки
        </template>

        <div class="col row">
            <a ref="download" style="display: none;" target="_blank"></a>

            <div class="full-height">
                <q-tabs
                    ref="tabs"
                    v-model="selectedTab"
                    class="bg-grey-3 text-black"
                    
                    left-icon="la la-caret-up"
                    right-icon="la la-caret-down"
                    active-color="white"
                    active-bg-color="primary"
                    indicator-color="black"
                    vertical
                    no-caps
                    stretch
                    inline-label
                >
                    <div v-show="tabsScrollable" class="q-pt-lg" />
                    <q-tab class="tab" name="profiles" icon="la la-users" label="Профили" />
                    <q-tab class="tab" name="view" icon="la la-eye" label="Вид" />
                    <q-tab class="tab" name="toolbar" icon="la la-grip-horizontal" label="Панель" />
                    <q-tab class="tab" name="keys" icon="la la-gamepad" label="Управление" />
                    <q-tab class="tab" name="pagemove" icon="la la-school" label="Листание" />
                    <q-tab class="tab" name="convert" icon="la la-magic" label="Конвертир." />
                    <q-tab class="tab" name="update" icon="la la-sync" label="Обновление" />
                    <q-tab class="tab" name="others" icon="la la-list-ul" label="Прочее" />
                    <q-tab class="tab" name="reset" icon="la la-broom" label="Сброс" />
                    <div v-show="tabsScrollable" class="q-pt-lg" />
                </q-tabs>
            </div>

            <div class="col fit">
                <!-- Профили --------------------------------------------------------------------->
                <div v-if="selectedTab == 'profiles'" class="fit tab-panel">
                    <ProfilesTab :form="form" />
                </div>
                <!-- Вид ------------------------------------------------------------------------->                    
                <!--div v-if="selectedTab == 'view'" class="fit column">
                    <q-tabs
                        v-model="selectedViewTab"
                        active-color="black"
                        active-bg-color="white"
                        indicator-color="white"
                        dense
                        no-caps
                        class="no-mp bg-grey-4 text-grey-7"
                    >
                        <q-tab name="mode" label="Режим" />
                        <q-tab name="color" label="Цвет" />
                        <q-tab name="font" label="Шрифт" />
                        <q-tab name="text" label="Текст" />
                        <q-tab name="status" label="Строка статуса" />
                    </q-tabs>

                    <div class="q-mb-sm" />

                    <div class="col tab-panel">
                        <div v-if="selectedViewTab == 'mode'">
                            @@include('./ViewTab/Mode.inc');
                        </div>

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
                </div-->
                <!-- Кнопки ---------------------------------------------------------------------->
                <div v-if="selectedTab == 'toolbar'" class="fit tab-panel">
                    <ToolBarTab :form="form" />
                </div>
                <!-- Управление ------------------------------------------------------------------>
                <!--div v-if="selectedTab == 'keys'" class="fit column">
                    @@include('./KeysTab.inc');
                </div-->
                <!-- Листание -------------------------------------------------------------------->
                <!--div v-if="selectedTab == 'pagemove'" class="fit tab-panel">
                    @@include('./PageMoveTab.inc');
                </div-->
                <!-- Конвертирование ------------------------------------------------------------->
                <!--div v-if="selectedTab == 'convert'" class="fit tab-panel">
                    @@include('./ConvertTab.inc');
                </div-->
                <!-- Обновление ------------------------------------------------------------------>
                <!--div v-if="selectedTab == 'update'" class="fit tab-panel">
                    @@include('./UpdateTab.inc');
                </div-->
                <!-- Прочее ---------------------------------------------------------------------->
                <!--div v-if="selectedTab == 'others'" class="fit tab-panel">
                    @@include('./OthersTab.inc');
                </div-->
                <!-- Сброс ----------------------------------------------------------------------->
                <!--div v-if="selectedTab == 'reset'" class="fit tab-panel">
                    @@include('./ResetTab.inc');
                </div-->
            </div>
        </div>
    </Window>
</template>

<script>
//-----------------------------------------------------------------------------
import vueComponent from '../../vueComponent.js';

import _ from 'lodash';

//stuff
import * as utils from '../../../share/utils';
import * as cryptoUtils from '../../../share/cryptoUtils';
import Window from '../../share/Window.vue';
import NumInput from '../../share/NumInput.vue';
import UserHotKeys from './UserHotKeys/UserHotKeys.vue';
import wallpaperStorage from '../share/wallpaperStorage';

import readerApi from '../../../api/reader';
import rstore from '../../../store/modules/reader';
import defPalette from './defPalette';

//pages
import ProfilesTab from './ProfilesTab/ProfilesTab.vue';
import ToolBarTab from './ToolBarTab/ToolBarTab.vue';

const hex = /^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/;

const componentOptions = {
    components: {
        Window,
        NumInput,
        UserHotKeys,
        //pages
        ProfilesTab,
        ToolBarTab,
    },
    watch: {
        settings: function() {
            this.settingsChanged();//no await
        },
        form: {
            handler(newValue) {
                if (this.inited && !this.setsChanged) {
                    this.commit('reader/setSettings', _.cloneDeep(newValue));
                }
            },
            deep: true,
        },
        fontBold: function(newValue) {
            this.fontWeight = (newValue ? 'bold' : '');
        },
        fontItalic: function(newValue) {
            this.fontStyle = (newValue ? 'italic' : '');
        },
        vertShift: function(newValue) {
            const font = (this.webFontName ? this.webFontName : this.fontName);
            if (this.fontShifts[font] != newValue || this.fontVertShift != newValue) {
                this.fontShifts = Object.assign({}, this.fontShifts, {[font]: newValue});
                this.fontVertShift = newValue;
            }
        },
        fontName: function(newValue) {
            const font = (this.webFontName ? this.webFontName : newValue);
            this.vertShift = this.fontShifts[font] || 0;
        },
        webFontName: function(newValue) {
            const font = (newValue ? newValue : this.fontName);
            this.vertShift = this.fontShifts[font] || 0;
        },
        wallpaper: function(newValue) {
            if (newValue != '' && this.pageChangeAnimation == 'flip')
                this.pageChangeAnimation = '';
        },
        dualPageMode(newValue) {
            if (newValue && this.pageChangeAnimation == 'flip' || this.pageChangeAnimation == 'rightShift')
                this.pageChangeAnimation = '';
        },
        textColor: function(newValue) {
            this.textColorFiltered = newValue;
        },
        textColorFiltered: function(newValue) {
            if (hex.test(newValue))
                this.textColor = newValue;
        },
        backgroundColor: function(newValue) {
            this.bgColorFiltered = newValue;
        },
        bgColorFiltered: function(newValue) {
            if (hex.test(newValue))
                this.backgroundColor = newValue;
        },
        dualDivColor(newValue) {
            this.dualDivColorFiltered = newValue;
        },
        dualDivColorFiltered(newValue) {
            if (hex.test(newValue))
                this.dualDivColor = newValue;
        },
        statusBarColor(newValue) {
            this.statusBarColorFiltered = newValue;
        },
        statusBarColorFiltered(newValue) {
            if (hex.test(newValue))
                this.statusBarColor = newValue;
        },
    },
};
class SettingsPage {
    _options = componentOptions;

    form = {};

    selectedTab = 'profiles';
    selectedViewTab = 'mode';
    selectedKeysTab = 'mouse';
    fontBold = false;
    fontItalic = false;
    vertShift = 0;
    tabsScrollable = false;
    textColorFiltered = '';
    bgColorFiltered = '';
    dualDivColorFiltered = '';
    statusBarColorFiltered = '';

    webFonts = [];
    fonts = [];    

    setsChanged = false;

    created() {
        this.commit = this.$store.commit;
        this.reader = this.$store.state.reader;

        this.settingsChanged();//no await
    }

    mounted() {
        this.$watch(
            '$refs.tabs.scrollable',
            (newValue) => {
                this.tabsScrollable = newValue && !this.$root.isMobileDevice;
            }
        );
    }

    init() {
        this.$refs.window.init();
        this.inited = true;
    }

    async settingsChanged() {
        if (_.isEqual(this.form, this.settings))
            return;

        this.setsChanged = true;
        try {
            this.form = _.cloneDeep(this.settings);
            const form = this.form;

            this.fontBold = (form.fontWeight == 'bold');
            this.fontItalic = (form.fontStyle == 'italic');

            this.fonts = rstore.fonts;
            this.webFonts = rstore.webFonts;
            const font = (form.webFontName ? form.webFontName : form.fontName);
            this.vertShift = form.fontShifts[font] || 0;
            this.textColorFiltered = form.textColor;
            this.bgColorFiltered = form.backgroundColor;
            this.dualDivColorFiltered = form.dualDivColor;
            this.statusBarColorFiltered = form.statusBarColor;
        } finally {
            await this.$nextTick();
            this.setsChanged = false;
        }
    }

    get mode() {
        return this.$store.state.config.mode;
    }

    get isExternalConverter() {
        return this.$store.state.config.useExternalBookConverter;
    }

    get settings() {
        return this.$store.state.reader.settings;
    }

    get configBucEnabled() {
        return this.$store.state.config.bucEnabled;
    }

    get wallpaperOptions() {
        let result = [{label: 'Нет', value: ''}];

        const userWallpapers = _.cloneDeep(this.userWallpapers);
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

    get fontsOptions() {
        let result = [];
        this.fonts.forEach(font => {
            result.push({label: (font.label ? font.label : font.name), value: font.name});
        });
        return result;
    }

    get webFontsOptions() {
        let result = [{label: 'Нет', value: ''}];
        this.webFonts.forEach(font => {
            result.push({label: font.name, value: font.name});
        });
        return result;
    }

    get pageChangeAnimationOptions() {
        let result = [
            {label: 'Нет', value: ''},
            {label: 'Вверх-вниз', value: 'downShift'},
            (!this.dualPageMode ? {label: 'Вправо-влево', value: 'rightShift'} : null),
            {label: 'Протаивание', value: 'thaw'},
            {label: 'Мерцание', value: 'blink'},
            {label: 'Вращение', value: 'rotate'},
            (this.wallpaper == '' && !this.dualPageMode ? {label: 'Листание', value: 'flip'} : null),
        ];        

        result = result.filter(v => v);

        return result;
    }

    get predefineTextColors() {
        return defPalette.concat([
          '#ffffff',
          '#000000',
          '#202020',
          '#323232',
          '#aaaaaa',
          '#00c0c0',
          '#ebe2c9',
          '#cfdc99',
          '#478355',
          '#909080',
        ]);
    }

    get predefineBackgroundColors() {
        return defPalette.concat([
          '#ffffff',
          '#000000',
          '#202020',
          '#ebe2c9',
          '#cfdc99',
          '#478355',
          '#a6caf0',
          '#909080',
          '#808080',
          '#c8c8c8',
        ]);
    }

    colorPanStyle(type) {
        let result = 'width: 30px; height: 30px; border: 1px solid black; border-radius: 4px;';
        switch (type) {
            case 'text':
                result += `background-color: ${this.textColor};`
                break;
            case 'bg':
                result += `background-color: ${this.backgroundColor};`
                break;
            case 'div':
                result += `background-color: ${this.dualDivColor};`
                break;
            case 'statusbar':
                result += `background-color: ${this.statusBarColor};`
                break;
        }
        return result;
    }

    needReload() {
        this.$root.notify.warning('Необходимо обновить страницу (F5), чтобы изменения возымели эффект');
    }

    needTextReload() {
        this.$root.notify.warning('Необходимо обновить книгу в обход кэша, чтобы изменения возымели эффект');
    }

    close() {
        this.$emit('do-action', {action: 'settings'});
    }

    async setDefaults() {
        try {
            if (await this.$root.stdDialog.confirm('Подтвердите установку настроек по умолчанию:', ' ')) {
                this.form = Object.assign({}, rstore.settingDefaults);
                for (let prop in rstore.settingDefaults) {
                    this[prop] = this.form[prop];
                }
            }
        } catch (e) {
            //
        }
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

        if (this.userWallpapers.length >= 100) {
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

                    const newUserWallpapers = _.cloneDeep(this.userWallpapers);
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

                    this.userWallpapers = newUserWallpapers;
                    this.wallpaper = cssClass;
                })();
            }

            reader.readAsDataURL(file);
        }
    }

    async delWallpaper() {
        if (this.wallpaper.indexOf('user-paper') == 0) {
            const newUserWallpapers = [];
            for (const wp of this.userWallpapers) {
                if (wp.cssClass != this.wallpaper) {
                    newUserWallpapers.push(wp);
                }
            }

            await wallpaperStorage.removeData(this.wallpaper);

            this.userWallpapers = newUserWallpapers;
            this.wallpaper = '';
        }
    }

    async downloadWallpaper() {
        if (this.wallpaper.indexOf('user-paper') != 0)
            return;

        try {
            const d = this.$refs.download;

            const dataUrl = await wallpaperStorage.getData(this.wallpaper);

            if (!dataUrl)
                throw new Error('Файл обоев не найден');

            d.href = dataUrl;
            d.download = `wallpaper-#${this.wallpaper.replace('user-paper', '').substring(0, 4)}`;

            d.click();
        } catch (e) {
            this.$root.stdDialog.alert(e.message, 'Ошибка', {color: 'negative'});
        }
    }

    keyHook(event) {
        if (!this.$root.stdDialog.active && event.type == 'keydown' && event.key == 'Escape') {
            this.close();
        }
        return true;
    }
}

export default vueComponent(SettingsPage);
//-----------------------------------------------------------------------------
</script>

<style scoped>
.tab {
    justify-content: initial;
}

.tab-panel {
    overflow-x: hidden;
    overflow-y: auto;
    font-size: 90%;
    padding: 0 10px 15px 10px;
}

.label-7 {
    width: 75px;
}

.label-2, .label-4, .label-5 {
    width: 110px;
}

.label-6 {
    width: 100px;
}

.input {
    max-width: 150px;
}

.no-mp {
    margin: 0;
    padding: 0;
}

.col-left {
    width: 150px;
}
</style>

<style>
.sets-part-header {
    border-top: 2px solid #bbbbbb;
    font-weight: bold;
    font-size: 110%;
    margin-top: 15px;
    margin-bottom: 5px;
}

.sets-label {
    display: flex;
    flex-direction: column;
    justify-content: center;
    text-align: right;
    margin-right: 10px;
    overflow: hidden;
}

.sets-item {
    width: 100%;
    margin-top: 5px;
    margin-bottom: 5px;
}

.sets-button {
    margin: 3px 15px 3px 0;
    padding: 0 5px 0 5px;
}
</style>
