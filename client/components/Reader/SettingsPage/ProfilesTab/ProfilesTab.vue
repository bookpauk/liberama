<template>
    <div class="fit sets-tab-panel">
        <div class="sets-part-header">
            Управление синхронизацией данных
        </div>

        <div class="sets-item row">
            <div class="sets-label label"></div>
            <q-checkbox v-model="serverSyncEnabled" class="col" size="xs" label="Включить синхронизацию с сервером" />
        </div>

        <div v-show="serverSyncEnabled">
            <!---------------------------------------------->
            <div class="sets-part-header">
                Профили устройств
            </div>

            <div class="sets-item row">
                <div class="sets-label label"></div>
                <div class="text col">
                    Выберите или добавьте профиль устройства, чтобы начать синхронизацию настроек с сервером.
                    <br>При выборе "Нет" синхронизация настроек (но не книг) отключается.
                </div>
            </div>
            <div class="sets-item row">
                <div class="sets-label label">
                    Устройство
                </div>
                <div class="col">
                    <q-select
                        v-model="currentProfile" :options="currentProfileOptions"
                        style="width: 275px"
                        dropdown-icon="la la-angle-down la-sm"
                        outlined dense emit-value map-options display-value-sanitize options-sanitize
                    />
                </div>
            </div>
            <div class="sets-item row">
                <div class="sets-label label"></div>
                <q-btn class="sets-button" dense no-caps @click="addProfile">
                    Добавить
                </q-btn>
                <q-btn class="sets-button" dense no-caps @click="delProfile">
                    Удалить
                </q-btn>
                <q-btn class="sets-button" dense no-caps @click="delAllProfiles">
                    Удалить все
                </q-btn>
            </div>

            <!---------------------------------------------->
            <div class="sets-part-header">
                Ключ доступа
            </div>
            
            <div class="sets-item row">
                <div class="sets-label label"></div>
                <div class="text col">
                    Ключ доступа позволяет восстановить профили с настройками и список читаемых книг.
                    Для этого необходимо передать ключ на новое устройство через почту, мессенджер или другим способом.
                </div>
            </div>

            <div class="sets-item row">
                <div class="sets-label label"></div>
                <q-btn class="sets-button" style="width: 250px" dense no-caps @click="showServerStorageKey">
                    <span v-show="serverStorageKeyVisible">Скрыть</span>
                    <span v-show="!serverStorageKeyVisible">Показать</span>
                    &nbsp;ключ доступа
                </q-btn>
            </div>

            <div class="sets-item row">
                <div class="sets-label label"></div>
                <div v-if="!serverStorageKeyVisible" class="col">
                    <hr />
                    <b>{{ partialStorageKey }}</b> (часть вашего ключа)
                    <hr />
                </div>
                <div v-else class="col" style="line-height: 100%">
                    <hr />
                    <div style="width: 300px; padding-top: 5px; overflow-wrap: break-word;">
                        <b>{{ serverStorageKey }}</b>
                        <q-icon class="copy-icon" name="la la-copy" @click="copyToClip(serverStorageKey, 'Ключ')">
                            <q-tooltip :delay="1000" anchor="top middle" self="center middle" content-style="font-size: 80%">
                                Скопировать
                            </q-tooltip>                    
                        </q-icon>            
                    </div>
                    <div v-if="mode == 'omnireader' || mode == 'liberama.top'">
                        <br>Переход по ссылке позволит автоматически ввести ключ доступа:
                        <br><div class="text-center" style="margin-top: 5px">
                            <a :href="setStorageKeyLink" target="_blank">Ссылка для ввода ключа</a>
                            <q-icon class="copy-icon" name="la la-copy" @click="copyToClip(setStorageKeyLink, 'Ссылка')">
                                <q-tooltip :delay="1000" anchor="top middle" self="center middle" content-style="font-size: 80%">
                                    Скопировать
                                </q-tooltip>                    
                            </q-icon>            
                        </div>
                    </div>
                    <hr />
                </div>
            </div>

            <div class="sets-item row">
                <div class="sets-label label"></div>
                <q-btn class="sets-button" style="width: 250px" dense no-caps @click="enterServerStorageKey">
                    Ввести ключ доступа
                </q-btn>
            </div>
            <div class="sets-item row">
                <div class="sets-label label"></div>
                <q-btn class="sets-button" style="width: 250px" dense no-caps @click="generateServerStorageKey">
                    Сгенерировать новый ключ
                </q-btn>
            </div>
            <div class="sets-item row">
                <div class="sets-label label"></div>
                <div class="text col">
                    Рекомендуется сохранить ключ в надежном месте, чтобы всегда иметь возможность восстановить настройки,
                    например, после переустановки ОС или чистки/смены браузера.<br>
                    <b>ПРЕДУПРЕЖДЕНИЕ!</b> При утере ключа, НИКТО не сможет восстановить ваши данные, т.к. они сжимаются
                    и шифруются ключом доступа перед отправкой на сервер.
                </div>
            </div>
        </div>
    </div>
</template>

<script>
//-----------------------------------------------------------------------------
import vueComponent from '../../../vueComponent.js';

import _ from 'lodash';

import * as utils from '../../../../share/utils';
import rstore from '../../../../store/modules/reader';

const componentOptions = {
    watch: {
    },
};
class ProfilesTab {
    _options = componentOptions;
    _props = {
        form: Object,
    };

    rstore = rstore;

    serverStorageKeyVisible = false;

    created() {
        this.commit = this.$store.commit;
    }

    mounted() {
    }

    get mode() {
        return this.$store.state.config.mode;
    }

    get serverSyncEnabled() {
        return this.$store.state.reader.serverSyncEnabled;
    }

    set serverSyncEnabled(newValue) {
        this.commit('reader/setServerSyncEnabled', newValue);
    }

    get currentProfile() {
        return this.$store.state.reader.currentProfile;
    }

    set currentProfile(newValue) {
        this.commit('reader/setCurrentProfile', newValue);
    }

    get profiles() {
        return this.$store.state.reader.profiles;
    }

    get currentProfileOptions() {
        const profNames = Object.keys(this.profiles)
        profNames.sort();

        let result = [{label: 'Нет', value: ''}];
        profNames.forEach(name => {
            result.push({label: name, value: name});
        });
        return result;
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

    async addProfile() {
        try {
            if (Object.keys(this.profiles).length >= 100) {
                this.$root.stdDialog.alert('Достигнут предел количества профилей', 'Ошибка');
                return;
            }
            const result = await this.$root.stdDialog.prompt('Введите произвольное название для профиля устройства:', ' ', {
                inputValidator: (str) => { if (!str) return 'Название не должно быть пустым'; else if (str.length > 50) return 'Слишком длинное название'; else return true; },
            });
            if (result && result.value) {
                if (this.profiles[result.value]) {
                    this.$root.stdDialog.alert('Такой профиль уже существует', 'Ошибка');
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
            const result = await this.$root.stdDialog.prompt(`<b>Предупреждение!</b> Удаление профиля '${this.$root.sanitize(this.currentProfile)}' необратимо.` +
                    `<br>Все настройки профиля будут потеряны, однако список читаемых книг сохранится.` +
                    `<br><br>Введите 'да' для подтверждения удаления:`, ' ', {
                inputValidator: (str) => { if (str && str.toLowerCase() === 'да') return true; else return 'Удаление не подтверждено'; },
            });

            if (result && result.value && result.value.toLowerCase() == 'да') {
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
            const result = await this.$root.stdDialog.prompt(`<b>Предупреждение!</b> Удаление ВСЕХ профилей с настройками необратимо.` +
                    `<br><br>Введите 'да' для подтверждения удаления:`, ' ', {
                inputValidator: (str) => { if (str && str.toLowerCase() === 'да') return true; else return 'Удаление не подтверждено'; },
            });

            if (result && result.value && result.value.toLowerCase() == 'да') {
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

    async showServerStorageKey() {
        this.serverStorageKeyVisible = !this.serverStorageKeyVisible;
    }

    async enterServerStorageKey(key) {
        try {
            const result = await this.$root.stdDialog.prompt(`<b>Предупреждение!</b> Изменение ключа доступа приведет к замене всех профилей и читаемых книг в читалке.` +
                    `<br><br>Введите новый ключ доступа:`, ' ', {
                inputValidator: (str) => {
                    try {
                        if (str && utils.fromBase58(str).length == 32) {
                            return true;
                        }
                    } catch (e) {
                        //
                    }
                    return 'Неверный формат ключа'; 
                },
                inputValue: (key && _.isString(key) ? key : null),
            });

            if (result && result.value && utils.fromBase58(result.value).length == 32) {
                this.commit('reader/setServerStorageKey', result.value);
            }
        } catch (e) {
            //
        }
    }

    async generateServerStorageKey() {
        try {
            const result = await this.$root.stdDialog.prompt(`<b>Предупреждение!</b> Генерация нового ключа доступа приведет к удалению всех профилей и читаемых книг в читалке.` +
                    `<br><br>Введите 'да' для подтверждения генерации нового ключа:`, ' ', {
                inputValidator: (str) => { if (str && str.toLowerCase() === 'да') return true; else return 'Генерация не подтверждена'; },
            });

            if (result && result.value && result.value.toLowerCase() == 'да') {
                if (this.$root.generateNewServerStorageKey)
                    this.$root.generateNewServerStorageKey();
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
            this.$root.notify.success(msg);
        else
            this.$root.notify.error(msg);
    }
}

export default vueComponent(ProfilesTab);
//-----------------------------------------------------------------------------
</script>

<style scoped>
.label {
    width: 75px;
}

.text {
    font-size: 90%;
    line-height: 130%;
}

.copy-icon {
    margin-left: 5px;
    cursor: pointer;
    font-size: 120%;
    color: blue;
}
</style>
