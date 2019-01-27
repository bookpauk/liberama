<template>
    <div ref="main" class="main" @click="close">
        <div class="mainWindow" @click.stop>
            <Window @close="close">
                <template slot="header">
                    Установить позицию
                </template>

                <div class="slider">
                    <el-slider v-model="sliderValue" :max="sliderMax" :format-tooltip="formatTooltip"></el-slider>
                </div>
            </Window>
        </div>
    </div>
</template>

<script>
//-----------------------------------------------------------------------------
import Vue from 'vue';
import Component from 'vue-class-component';
import _ from 'lodash';

import Window from '../../share/Window.vue';

export default @Component({
    components: {
        Window,
    },
    watch: {
        sliderValue: function(newValue) {
            this.debouncedEmitPosChange(newValue);
        },
    },
})
class SetPositionPage extends Vue {
    sliderValue = null;
    sliderMax = null;

    created() {
        this.commit = this.$store.commit;
        this.reader = this.$store.state.reader;

        this.debouncedEmitPosChange = _.debounce((newValue) => {
            this.$emit('book-pos-changed', {bookPos: newValue});
        }, 500);
    }

    formatTooltip(val) {
        if (this.sliderMax)
            return (val/this.sliderMax*100).toFixed(2) + '%';
        else
            return 0;
    }

    close() {
        this.$emit('set-position-toggle');
    }

    keyHook(event) {
        if (event.type == 'keydown' && (event.code == 'Escape' || event.code == 'KeyP')) {
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
    z-index: 40;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}

.mainWindow {
    width: 100%;
    max-width: 600px;
    height: 140px;
    display: flex;
    position: relative;
    top: -50px;
}

.slider {
    margin: 20px;
    background-color: #efefef;
    border-radius: 15px;
}

.el-slider {
    margin-right: 20px;
    margin-left: 20px;
}
</style>