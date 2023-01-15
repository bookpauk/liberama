<template>
    <Window ref="window" height="125px" max-width="600px" :top-shift="-50" @close="close">
        <template #header>
            Установить позицию
        </template>

        <div class="col column justify-center">
            <div id="set-position-slider" class="slider q-px-md column justify-center">
                <q-slider
                    v-model="sliderValue"
                    thumb-path="M 2, 10 a 8.5,8.5 0 1,0 17,0 a 8.5,8.5 0 1,0 -17,0"
                    
                    :max="sliderMax"
                    label
                    :label-value="(sliderMax ? (sliderValue/sliderMax*100).toFixed(2) + '%' : 0)"
                    color="primary"
                />
            </div>
        </div>
    </Window>
</template>

<script>
//-----------------------------------------------------------------------------
import vueComponent from '../../vueComponent.js';

import Window from '../../share/Window.vue';

const componentOptions = {
    components: {
        Window,
    },
    watch: {
        sliderValue: function(newValue) {
            if (this.initialized)
                this.$emit('book-pos-changed', {bookPos: newValue});
        },
    },
};
class SetPositionPage {
    _options = componentOptions;

    sliderValue = null;
    sliderMax = null;

    created() {
        this.commit = this.$store.commit;
        this.reader = this.$store.state.reader;
        this.initialized = false;
    }

    init(sliderValue, sliderMax) {
        this.$refs.window.init();
        
        this.sliderMax = sliderMax;
        this.sliderValue = sliderValue;
        this.initialized = true;
    }

    close() {
        this.$emit('set-position-toggle');
    }

    keyHook(event) {
        if (event.type == 'keydown') {
            const action = this.$root.readerActionByKeyEvent(event);
            if (event.key == 'Escape' || action == 'setPosition') {
                this.close();
            }
        }
        return true;
    }
}

export default vueComponent(SetPositionPage);
//-----------------------------------------------------------------------------
</script>

<style scoped>
.slider {
    margin: 0 20px 0 20px;
    height: 35px;
    background-color: var(--bg-input-color);
    border-radius: 15px;
}
</style>

<style>
#set-position-slider .q-slider__thumb path {
    fill: white !important;
    stroke: blue !important;
    stroke-width: 2 !important;
}

</style>