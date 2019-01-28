<template>
    <div ref="main" class="main" @click="close">
        <div class="mainWindow" @click.stop>
            <Window @close="close">
                <template slot="header">
                    Настройки
                </template>

                <el-tabs type="border-card" tab-position="left" style="height: 100%;" v-model="selectedTab">
                    <el-tab-pane label="Вид">
                        <el-form :model="form" size="small" label-width="100px">
                            <div class="partHeader">Цвет</div>

                            <el-form-item label="Текст">
                                <el-color-picker v-model="textColor" color-format="hex" :predefine="predefineTextColors"></el-color-picker>
                                <span class="color-picked"><b>{{ textColor }}</b></span>
                            </el-form-item>

                            <el-form-item label="Фон">
                                <el-color-picker v-model="backgroundColor" color-format="hex" :predefine="predefineBackgroundColors"></el-color-picker>
                                <span class="color-picked"><b>{{ backgroundColor }}</b></span>
                            </el-form-item>
                        </el-form>

                        <el-form :model="form" size="mini" label-width="100px">
                            <div class="partHeader">Шрифт</div>

                            <el-form-item label="Размер/наз.">
                                    <el-col :span="11">
                                        <el-input-number v-model="fontSize" :min="5" :max="100"></el-input-number>
                                    </el-col>
                                    <el-col :span="11">
                                        <el-select v-model="fontName" placeholder="Шрифт">
                                            <el-option label="По-умолчанию" value="ReaderDefault"></el-option>
                                            <el-option label="BPG Arial" value="GEO_1"></el-option>
                                            <el-option value="Avrile"></el-option>
                                            <el-option value="Arimo"></el-option>
                                            <el-option value="Roboto"></el-option>
                                            <el-option value="OpenSans"></el-option>
                                            <el-option value="Rubik"></el-option>
                                        </el-select>
                                    </el-col>
                            </el-form-item>
                        </el-form>

                        <el-form :model="form" size="mini" label-width="100px">
                            <div class="partHeader">Текст</div>
                        </el-form>

                        <el-form :model="form" size="mini" label-width="100px">
                            <div class="partHeader">Строка статуса</div>
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

const propsData = {
    textColor: '#000000',
    backgroundColor: '#EBE2C9',
    fontStyle: '',// 'italic'
    fontWeight: '',// 'bold'
    fontSize: 20,// px
    fontName: 'ReaderDefault',
    fontCssUrl: '',
    fontVertShift: 0,

    lineInterval: 3,// px, межстрочный интервал
    textAlignJustify: true,// выравнивание по ширине
    p: 25,// px, отступ параграфа
    indent: 15,// px, отступ всего текста слева и справа
    wordWrap: true,//перенос по слогам
    keepLastToFirst: true,// перенос последней строки в первую при листании

    showStatusBar: true,
    statusBarTop: false,// top, bottom
    statusBarHeight: 19,// px
    statusBarColorAlpha: 0.4,

    pageChangeTransition: '',// '' - нет, downShift, rightShift, thaw - протаивание, blink - мерцание
    pageChangeTransitionSpeed: 50, //0-100%

    allowUrlParamBookPos: true,
};

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
        for (let prop in propsData) {
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
          '#478355',
          '#909080',
          '#808080',
          '#a6caf0',
          '#c8c8c8',
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
    margin-bottom: 15px;
}

.el-form-item {
    padding: 0;
    margin: 0;
    position: relative;
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
</style>