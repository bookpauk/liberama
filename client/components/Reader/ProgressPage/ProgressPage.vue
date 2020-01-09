<template>
    <div v-show="visible" class="main">
        <div class="center">
            <!--el-progress type="circle" :width="100" :stroke-width="6" color="#0F9900" :percentage="percentage"></el-progress-->
            <q-circular-progress
                show-value
                instant-feedback
                font-size="14px"
                :value="percentage"
                size="100px"
                :thickness="0.1"
                color="green-7"
                track-color="grey-4"
                class="q-ma-md"
            >
              {{ percentage }}%
            </q-circular-progress>

            <p class="text">{{ text }}</p>
        </div>
    </div>
</template>

<script>
//-----------------------------------------------------------------------------
import Vue from 'vue';
import Component from 'vue-class-component';

const ruMessage = {
    'start': ' ',
    'finish': ' ',
    'error': ' ',
    'download': 'скачивание',
    'decompress': 'распаковка',
    'convert': 'конвертирование',
    'loading': 'загрузка',
    'parse': 'обработка',
    'upload': 'отправка',
};

export default @Component({
})
class ProgressPage extends Vue {
    text = '';
    totalSteps = 1;
    step = 1;
    progress = 0;
    visible = false;

    show() {
        this.$el.style.width = this.$parent.$el.offsetWidth + 'px';
        this.$el.style.height = this.$parent.$el.offsetHeight + 'px';
        this.text = '';
        this.totalSteps = 1;
        this.step = 1;
        this.progress = 0;

        this.visible = true;
    }

    hide() {
        this.visible = false;
    }

    setState(state) {
        if (state.state)
            this.text = (ruMessage[state.state] ? ruMessage[state.state] : state.state);
        this.step = (state.step ? state.step : this.step);
        this.totalSteps = (state.totalSteps > this.totalSteps ? state.totalSteps : this.totalSteps);
        this.progress = state.progress || 0;
    }

    get percentage() {
        let circle = document.querySelector('path[class="el-progress-circle__path"]');
        if (circle)
            circle.style.transition = '';
        return Math.round(((this.step - 1)/this.totalSteps + this.progress/(100*this.totalSteps))*100);
    }
}
//-----------------------------------------------------------------------------
</script>
<style scoped>
.main {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    z-index: 100;
    background-color: rgba(0, 0, 0, 0.8);

    position: absolute;
}
.center {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;

    color: white;
    height: 250px;
}

.text {
    color: yellow;
}

</style>
<style>
.el-progress__text {
    color: lightgreen !important;
}
</style>
