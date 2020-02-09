<template lang="includer">
    <Window ref="window" height="95%" width="600px" @close="close">
        <template slot="header">
            Настройки
        </template>

        <!--q-tabs
          v-model="tab"
          vertical
          class="text-teal"
        >
          <q-tab name="mails" icon="mail" label="Mails" />
          <q-tab name="alarms" icon="alarm" label="Alarms" />
          <q-tab name="movies" icon="movie" label="Movies" />
        </q-tabs-->

        <el-tabs type="border-card" tab-position="left" v-model="selectedTab">
            <!-- Профили --------------------------------------------------------------------->
            @@include('./includeOld/ProfilesTabOld.inc');

            <!-- Вид ------------------------------------------------------------------------->                    
            @@include('./includeOld/ViewTabOld.inc');

            <!-- Кнопки ---------------------------------------------------------------------->
            @@include('./includeOld/ButtonsTabOld.inc');

            <!-- Управление ------------------------------------------------------------------>
            @@include('./includeOld/KeysTabOld.inc');

            <!-- Листание -------------------------------------------------------------------->
            @@include('./includeOld/PageMoveTabOld.inc');
            
            <!-- Прочее ---------------------------------------------------------------------->
            @@include('./includeOld/OthersTabOld.inc');

            <!-- Сброс ----------------------------------------------------------------------->
            @@include('./includeOld/ResetTabOld.inc');
                        
        </el-tabs>
    </Window>
</template>

<script>
//-----------------------------------------------------------------------------
import Vue from 'vue';
import Component from 'vue-class-component';
import _ from 'lodash';

import * as utils from '../../../share/utils';
import Window from '../../share/Window.vue';
import rstore from '../../../store/modules/reader';

export default @Component({
    components: {
        Window,
    },
    data: function() {
        return Object.assign({}, rstore.settingDefaults);
    },
    watch: {
        settings: function() {
            this.settingsChanged();
        },
        form: function(newValue) {
            if (this.inited)
                this.commit('reader/setSettings', newValue);
        },
        fontBold: function(newValue) {
            this.fontWeight = (newValue ? 'bold' : '');
        },
        fontItalic: function(newValue) {
            this.fontStyle = (newValue ? 'italic' : '');
        },
        vertShift: function(newValue) {
            const font = (this.webFontName ? this.webFontName : this.fontName);
            this.fontShifts = Object.assign({}, this.fontShifts, {[font]: newValue});
            this.fontVertShift = newValue;
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
    },
})
class SettingsPage extends Vue {
    selectedTab = null;
    form = {};
    fontBold = false;
    fontItalic = false;
    vertShift = 0;

    webFonts = [];
    fonts = [];

    serverStorageKeyVisible = false;
    toolButtons = [];

    created() {
        this.commit = this.$store.commit;
        this.reader = this.$store.state.reader;

        this.form = {};
        this.toolButtons = rstore.toolButtons;
        this.settingsChanged();
    }

    init() {
        this.$refs.window.init();
        this.inited = true;
    }

    settingsChanged() {
        if (_.isEqual(this.form, this.settings))
            return;
        this.form = Object.assign({}, this.settings);
        for (let prop in rstore.settingDefaults) {
            this[prop] = this.form[prop];
            this.$watch(prop, (newValue) => {
                this.form = Object.assign({}, this.form, {[prop]: newValue});
            });
        }

        this.fontBold = (this.fontWeight == 'bold');
        this.fontItalic = (this.fontStyle == 'italic');

        this.fonts = rstore.fonts;
        this.webFonts = rstore.webFonts;
        const font = (this.webFontName ? this.webFontName : this.fontName);
        this.vertShift = this.fontShifts[font] || 0;
    }

    get mode() {
        return this.$store.state.config.mode;
    }

    get settings() {
        return this.$store.state.reader.settings;
    }

    get serverSyncEnabled() {
        return this.$store.state.reader.serverSyncEnabled;
    }

    set serverSyncEnabled(newValue) {
        this.commit('reader/setServerSyncEnabled', newValue);
    }

    get profiles() {
        return this.$store.state.reader.profiles;
    }

    get profilesArray() {
        const result = Object.keys(this.profiles)
        result.sort();
        return result;
    }

    get currentProfile() {
        return this.$store.state.reader.currentProfile;
    }

    set currentProfile(newValue) {
        this.commit('reader/setCurrentProfile', newValue);
    }

    get partialStorageKey() {
        return this.serverStorageKey.substr(0, 7) + '***';
    }

    get serverStorageKey() {
        return this.$store.state.reader.serverStorageKey;
    }

    get setStorageKeyLink() {
        return `https://${window.location.host}/#/reader?setStorageAccessKey=${utils.toBase58(this.serverStorageKey)}`;
    }

    get predefineTextColors() {
        return [
          '#ffffff',
          '#000000',
          '#202020',
          '#323232',
          '#aaaaaa',
          '#00c0c0',
        ];
    }

    get predefineBackgroundColors() {
        return [
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
        ];
    }

    needReload() {
        this.$notify.warning({message: 'Необходимо обновить страницу (F5), чтобы изменения возымели эффект'});
    }

    needTextReload() {
        this.$notify.warning({message: 'Необходимо обновить книгу в обход кэша, чтобы изменения возымели эффект'});
    }

    close() {
        this.$emit('settings-toggle');
    }

    async setDefaults() {
        try {
            if (await this.$confirm('Подтвердите установку настроек по умолчанию:', '', {
                confirmButtonText: 'OK',
                cancelButtonText: 'Отмена',
                customClass: 'prompt-dialog',
                type: 'warning'
            })) {
                this.form = Object.assign({}, rstore.settingDefaults);
                for (let prop in rstore.settingDefaults) {
                    this[prop] = this.form[prop];
                }
            }
        } catch (e) {
            //
        }
    }

    changeShowToolButton(buttonName) {
        this.showToolButton = Object.assign({}, this.showToolButton, {[buttonName]: !this.showToolButton[buttonName]});
    }

    async addProfile() {
        try {
            if (Object.keys(this.profiles).length >= 100) {
                this.$alert('Достигнут предел количества профилей', 'Ошибка');
                return;
            }
            const result = await this.$prompt('Введите произвольное название для профиля устройства:', '', {
                confirmButtonText: 'OK',
                cancelButtonText: 'Отмена',
                inputValidator: (str) => { if (!str) return 'Название не должно быть пустым'; else if (str.length > 50) return 'Слишком длинное название'; else return true; },
                customClass: 'prompt-dialog',
            });
            if (result.value) {
                if (this.profiles[result.value]) {
                    this.$alert('Такой профиль уже существует', 'Ошибка');
                } else {
                    const newProfiles = Object.assign({}, this.profiles, {[result.value]: 1});
                    this.commit('reader/setAllowProfilesSave', true);
                    await this.$nextTick();//ждем обработчики watch
                    this.commit('reader/setProfiles', newProfiles);
                    await this.$nextTick();//ждем обработчики watch
                    this.commit('reader/setAllowProfilesSave', false);
                    this.currentProfile = result.value;
                }
            }
        } catch (e) {
            //
        }
    }

    async delProfile() {
        if (!this.currentProfile)
            return;

        try {
            const result = await this.$prompt(`<b>Предупреждение!</b> Удаление профиля '${this.currentProfile}' необратимо.` +
                    `<br>Все настройки профиля будут потеряны,<br>однако список читаемых книг сохранится.` +
                    `<br><br>Введите 'да' для подтверждения удаления:`, '', {
                dangerouslyUseHTMLString: true,
                confirmButtonText: 'OK',
                cancelButtonText: 'Отмена',
                inputValidator: (str) => { if (str && str.toLowerCase() === 'да') return true; else return 'Удаление не подтверждено'; },
                customClass: 'prompt-dialog',
                type: 'warning',
            });

            if (result.value && result.value.toLowerCase() == 'да') {
                if (this.profiles[this.currentProfile]) {
                    const newProfiles = Object.assign({}, this.profiles);
                    delete newProfiles[this.currentProfile];
                    this.commit('reader/setAllowProfilesSave', true);
                    await this.$nextTick();//ждем обработчики watch
                    this.commit('reader/setProfiles', newProfiles);
                    await this.$nextTick();//ждем обработчики watch
                    this.commit('reader/setAllowProfilesSave', false);
                    this.currentProfile = '';
                }
            }
        } catch (e) {
            //
        }
    }

    async delAllProfiles() {
        if (!Object.keys(this.profiles).length)
            return;

        try {
            const result = await this.$prompt(`<b>Предупреждение!</b> Удаление ВСЕХ профилей с настройками необратимо.` +
                    `<br><br>Введите 'да' для подтверждения удаления:`, '', {
                dangerouslyUseHTMLString: true,
                confirmButtonText: 'OK',
                cancelButtonText: 'Отмена',
                inputValidator: (str) => { if (str && str.toLowerCase() === 'да') return true; else return 'Удаление не подтверждено'; },
                customClass: 'prompt-dialog',
                type: 'warning',
            });

            if (result.value && result.value.toLowerCase() == 'да') {
                this.commit('reader/setAllowProfilesSave', true);
                await this.$nextTick();//ждем обработчики watch
                this.commit('reader/setProfiles', {});
                await this.$nextTick();//ждем обработчики watch
                this.commit('reader/setAllowProfilesSave', false);
                this.currentProfile = '';
            }
        } catch (e) {
            //
        }
    }

    async copyToClip(text, prefix) {
        const result = await utils.copyTextToClipboard(text);
        const suf = (prefix.substr(-1) == 'а' ? 'а' : '');
        const msg = (result ? `${prefix} успешно скопирован${suf} в буфер обмена` : 'Копирование не удалось');
        if (result)
            this.$notify.success({message: msg});
        else
            this.$notify.error({message: msg});
    }

    async showServerStorageKey() {
        this.serverStorageKeyVisible = !this.serverStorageKeyVisible;
    }

    async enterServerStorageKey(key) {
        try {
            const result = await this.$prompt(`<b>Предупреждение!</b> Изменение ключа доступа приведет к замене всех профилей и читаемых книг в читалке.` +
                    `<br><br>Введите новый ключ доступа:`, '', {
                dangerouslyUseHTMLString: true,
                confirmButtonText: 'OK',
                cancelButtonText: 'Отмена',
                inputValidator: (str) => { if (str && utils.fromBase58(str).length == 32) return true; else return 'Неверный формат ключа'; },
                inputValue: (key && _.isString(key) ? key : null),
                customClass: 'prompt-dialog',
                type: 'warning',
            });

            if (result.value && utils.fromBase58(result.value).length == 32) {
                this.commit('reader/setServerStorageKey', result.value);
            }
        } catch (e) {
            //
        }
    }

    async generateServerStorageKey() {
        try {
            const result = await this.$prompt(`<b>Предупреждение!</b> Генерация нового ключа доступа приведет к удалению всех профилей и читаемых книг в читалке.` +
                    `<br><br>Введите 'да' для подтверждения генерации нового ключа:`, '', {
                dangerouslyUseHTMLString: true,
                confirmButtonText: 'OK',
                cancelButtonText: 'Отмена',
                inputValidator: (str) => { if (str && str.toLowerCase() === 'да') return true; else return 'Генерация не подтверждена'; },
                customClass: 'prompt-dialog',
                type: 'warning',
            });

            if (result.value && result.value.toLowerCase() == 'да') {
                this.$root.$emit('generateNewServerStorageKey');
            }
        } catch (e) {
            //
        }

    }

    keyHook(event) {
        if (event.type == 'keydown' && event.code == 'Escape') {
            this.close();
        }
        return true;
    }
}
//-----------------------------------------------------------------------------
</script>

<style scoped>
.text {
    font-size: 90%;
    line-height: 130%;
}

.el-form {
    border-top: 2px solid #bbbbbb;
    margin-bottom: 5px;
}

.el-form-item {
    padding: 0 !important;
    margin: 0 !important;
    margin-bottom: 5px !important;
}

.color-picked {
    margin-left: 10px;
    position: relative;
    top: -11px;
}

.partHeader {
    font-weight: bold;
    margin-bottom: 5px;
}

.el-tabs {
    flex: 1;
    display: flex;
}

.el-tab-pane {
    flex: 1;
    display: flex;
    flex-direction: column;
    width: 420px;
    overflow-y: auto;
    padding: 15px;
}

.center {
    text-align: center;
}
</style>

<style>
.prompt-dialog {
    width: 100% !important;
    max-width: 450px;
}
</style>