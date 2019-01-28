<template>
    <div ref="main" class="main" @click="close">
        <div class="mainWindow" @click.stop>
            <Window @close="close">
                <template slot="header">
                    Настройки
                </template>

                <el-tabs type="border-card" tab-position="left" style="height: 100%;" v-model="selectedTab">
                    <el-tab-pane label="Вид">
                        <el-form :model="form" size="mini" label-width="100px">
                            <el-form-item>
                                <b>Цвет</b>
                            </el-form-item>
                            <el-form-item label="Текст">
                                <el-color-picker v-model="textColor" show-alpha :predefine="predefineTextColors"></el-color-picker>
                            </el-form-item>

                            <el-form-item label="Фон">
                                <el-color-picker v-model="backgroundColor" show-alpha :predefine="predefineBackgroundColors"></el-color-picker>
                            </el-form-item>
                        </el-form>

                        <el-form :model="form" size="mini" label-width="100px">
                            <el-form-item>
                                Шрифт
                            </el-form-item>
                        </el-form>

                        <el-form :model="form" size="mini" label-width="100px">
                            <el-form-item>
                                Текст
                            </el-form-item>
                        </el-form>

                        <el-form :model="form" size="mini" label-width="100px">
                            <el-form-item>
                                Строка статуса
                            </el-form-item>
                        </el-form>
                    </el-tab-pane>
                    <el-tab-pane label="Листание">
                        
                    </el-tab-pane>
                    <el-tab-pane label="Другое">
                        
                    </el-tab-pane>
                </el-tabs>
            </Window>
        </div>
    </div>
</template>

<script>
//-----------------------------------------------------------------------------
import Vue from 'vue';
import Component from 'vue-class-component';

import Window from '../../share/Window.vue';

const props = [
    'textColor',
    'backgroundColor'
];

let propsData = {};
for (const prop of props)
    propsData[prop] = null;

export default @Component({
    components: {
        Window,
    },
    data: function() {
        return Object.assign({}, propsData);
    },
    watch: {
        form: function(newValue) {
            this.commit('reader/setSettings', newValue);
        },
    },
})
class SettingsPage extends Vue {
    selectedTab = null;
    form = {};

    created() {
        this.commit = this.$store.commit;
        this.reader = this.$store.state.reader;

        this.form = this.settings;
        for (const prop of props) {
            this[prop] = this.form[prop];
            this.$watch(prop, (newValue) => {
                this.form = Object.assign({}, this.form, {[prop]: newValue})
            });
        }
    }

    get settings() {
        return this.$store.state.reader.settings;
    }

    get predefineTextColors() {
        return [
          '#ff4500',
          '#ff8c00',
        ];
    }

    get predefineBackgroundColors() {
        return [
          '#ff4500',
          '#ff8c00',
          '#ffd700',
          '#c71585',
          'rgba(255, 69, 0, 0.68)',
        ];
    }

    close() {
        this.$emit('settings-toggle');
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
.main {
    position: absolute;
    width: 100%;
    height: 100%;
    z-index: 60;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}

.mainWindow {
    width: 100%;
    max-width: 600px;
    height: 70%;
    display: flex;
    position: relative;
}

.el-form {
    border-top: 2px solid #bbbbbb;
}

.el-form-item {
    padding: 0;
    margin: 0;
}
</style>