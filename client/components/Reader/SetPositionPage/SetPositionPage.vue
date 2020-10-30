<template>
    <Window ref="window" height="140px" max-width="600px" :top-shift="-50" @close="close">
        <template slot="header">
            Установить позицию
        </template>

        <div id="set-position-slider" class="slider q-px-md">
            <q-slider
                thumb-path="M 2, 10 a 8.5,8.5 0 1,0 17,0 a 8.5,8.5 0 1,0 -17,0"
                v-model="sliderValue"
                :max="sliderMax"
                label
                :label-value="(sliderMax ? (sliderValue/this.sliderMax*100).toFixed(2) + '%' : 0)"
                color="primary"
            />
        </div>
    </Window>
</template>

<script>
//-----------------------------------------------------------------------------
import Vue from 'vue';
import Component from 'vue-class-component';

import Window from '../../share/Window.vue';

export default @Component({
    components: {
        Window,
    },
    watch: {
        sliderValue: function(newValue) {
            if (this.initialized)
                this.$emit('book-pos-changed', {bookPos: newValue});
        },
    },
})
class SetPositionPage extends Vue {
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
//-----------------------------------------------------------------------------
</script>

<style scoped>
.slider {
    margin: 20px;
    background-color: #efefef;
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