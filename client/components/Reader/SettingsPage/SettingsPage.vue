<template>
    <Window ref="window" width="600px" @close="close">
        <template #header>
            Настройки
        </template>

        <div class="col row">
            <div class="full-height">
                <q-tabs
                    ref="tabs"
                    v-model="selectedTab"
                    class="bg-grey-3 text-grey-9"
                    style="max-width: 130px"
                    
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
                    <q-tab v-for="item in tabs" :key="item.name" class="tab row items-center" :name="item.name">
                        <q-icon :name="item.icon" :color="selectedTab == item.name ? 'yellow' : 'teal-7'" size="24px" />
                        <div class="q-ml-xs" style="font-size: 90%">
                            {{ item.label }}
                        </div>
                    </q-tab>
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
import { reactive } from 'vue';

import _ from 'lodash';

//stuff
import Window from '../../share/Window.vue';

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
                if (this.inited && !this.isSetsChanged) {
                    this.debouncedCommitSettings();
                }
            },
            deep: true,
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

    tabs = [
        { name: 'profiles', icon: 'la la-users', label: 'Профили' },
        { name: 'view', icon: 'la la-eye', label: 'Вид'},
        { name: 'toolbar', icon: 'la la-grip-horizontal', label: 'Панель'},
        { name: 'keys', icon: 'la la-gamepad', label: 'Управление'},
        { name: 'pagemove', icon: 'la la-school', label: 'Листание'},
        { name: 'convert', icon: 'la la-magic', label: 'Конвертир.'},
        { name: 'update', icon: 'la la-retweet', label: 'Обновление'},
        { name: 'others', icon: 'la la-list-ul', label: 'Прочее'},
        { name: 'reset', icon: 'la la-broom', label: 'Сброс'},
    ];
    selectedTab = 'profiles';

    isSetsChanged = false;

    statusBarColorFiltered = '';

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
        this.isSetsChanged = true;
        try {
            this.form = reactive(_.cloneDeep(this.settings));
            const form = this.form;

            this.statusBarColorFiltered = form.statusBarColor;
        } finally {
            await this.$nextTick();
            this.isSetsChanged = false;
        }
    }

    get settings() {
        return this.$store.state.reader.settings;
    }

    needReload() {
        this.$root.notify.warning('Необходимо обновить страницу (F5), чтобы изменения возымели эффект');
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
