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
                    <q-tab class="tab" name="profiles" icon="la la-users" label="Профили" />
                    <q-tab class="tab" name="view" icon="la la-eye" label="Вид" />
                    <q-tab class="tab" name="toolbar" icon="la la-grip-horizontal" label="Панель" />
                    <q-tab class="tab" name="keys" icon="la la-gamepad" label="Управление" />
                    <q-tab class="tab" name="pagemove" icon="la la-school" label="Листание" />
                    <q-tab class="tab" name="convert" icon="la la-magic" label="Конвертир." />
                    <q-tab class="tab" name="update" icon="la la-retweet" label="Обновление" />
                    <q-tab class="tab" name="others" icon="la la-list-ul" label="Прочее" />
                    <q-tab class="tab" name="reset" icon="la la-broom" label="Сброс" />
                </q-tabs>
            </div>

            <div class="col fit">
                <!-- Профили --------------------------------------------------------------------->
                <ProfilesTab v-if="selectedTab == 'profiles'" :form="form" />
                <!-- Вид ------------------------------------------------------------------------->                    
                <ViewTab v-if="selectedTab == 'view'" :form="form" />
                <!-- Кнопки ---------------------------------------------------------------------->
                <ToolBarTab v-if="selectedTab == 'toolbar'" :form="form" />
                <!-- Управление ------------------------------------------------------------------>
                <KeysTab v-if="selectedTab == 'keys'" :form="form" />
                <!-- Листание -------------------------------------------------------------------->
                <PageMoveTab v-if="selectedTab == 'pagemove'" :form="form" />
                <!-- Конвертирование ------------------------------------------------------------->
                <ConvertTab v-if="selectedTab == 'convert'" :form="form" />
                <!-- Обновление ------------------------------------------------------------------>
                <UpdateTab v-if="selectedTab == 'update'" :form="form" />
                <!-- Прочее ---------------------------------------------------------------------->
                <OthersTab v-if="selectedTab == 'others'" :form="form" />
                <!-- Сброс ----------------------------------------------------------------------->                
                <ResetTab v-if="selectedTab == 'reset'" :form="form" @tab-event="tabEvent" />
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
import wallpaperStorage from '../share/wallpaperStorage';

import readerApi from '../../../api/reader';
import rstore from '../../../store/modules/reader';

//pages
import ProfilesTab from './ProfilesTab/ProfilesTab.vue';
import ViewTab from './ViewTab/ViewTab.vue';
import ToolBarTab from './ToolBarTab/ToolBarTab.vue';
import KeysTab from './KeysTab/KeysTab.vue';
import PageMoveTab from './PageMoveTab/PageMoveTab.vue';
import ConvertTab from './ConvertTab/ConvertTab.vue';
import UpdateTab from './UpdateTab/UpdateTab.vue';
import OthersTab from './OthersTab/OthersTab.vue';
import ResetTab from './ResetTab/ResetTab.vue';

const hex = /^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/;

const componentOptions = {
    components: {
        Window,
        //pages
        ProfilesTab,
        ViewTab,
        ToolBarTab,
        KeysTab,
        PageMoveTab,
        ConvertTab,
        UpdateTab,
        OthersTab,
        ResetTab,
    },
    watch: {
        settings: function() {
            this.settingsChanged();//no await
        },
        form: {
            handler() {
                if (this.inited && !this.setsChanged) {
                    this.debouncedCommitSettings();
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
        /*this.$watch('form.dualPageMode', (newValue) => {
            console.log(newValue);
        })*/        
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

    setsChanged = false;

    fontBold = false;
    fontItalic = false;
    vertShift = 0;
    textColorFiltered = '';
    bgColorFiltered = '';
    statusBarColorFiltered = '';
    webFonts = [];
    fonts = [];    

    created() {
        this.commit = this.$store.commit;

        this.debouncedCommitSettings = _.debounce(() => {
            this.commit('reader/setSettings', _.cloneDeep(this.form));
        }, 50);

        this.settingsChanged();//no await
    }

    mounted() {
    }

    init() {
        this.$refs.window.init();
        this.inited = true;
    }

    async settingsChanged() {
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

    get settings() {
        return this.$store.state.reader.settings;
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
                this.form = _.cloneDeep(rstore.settingDefaults);
            }
        } catch (e) {
            //
        }
    }

    tabEvent(event) {
        if (!event || !event.action)
            return;

        switch (event.action) {
            case 'set-defaults': this.setDefaults(); break;
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
</style>

<style>
.sets-tab-panel {
    overflow-x: hidden;
    overflow-y: auto;
    font-size: 90%;
    padding: 0 10px 15px 10px;
}

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
