<template>
    <div v-show="visible" class="main">
        <div class="center">
            <el-progress type="circle" :width="100" :stroke-width="5" color="#0F9900" :percentage="percentage"></el-progress>
            <p class="text">{{ text }}</p>
        </div>
    </div>
</template>

<script>
//-----------------------------------------------------------------------------
import Vue from 'vue';
import Component from 'vue-class-component';
import {sleep} from '../../../share/utils';

const ruMessage = {
    'start': ' ',
    'finish': ' ',
    'error': ' ',
    'download': 'скачивание',
    'decompress': 'распаковка',
    'convert': 'конвертирование',
    'loading': 'загрузка',
    'parse': 'обработка',
};

export default @Component({
})
class ProgressPage extends Vue {
    text = '';
    totalSteps = 1;
    step = 1;
    progress = 0;
    visible = false;

    async show() {
        this.$el.style.width = this.$parent.$el.offsetWidth + 'px';
        this.$el.style.height = this.$parent.$el.offsetHeight + 'px';
        this.text = '';
        this.totalSteps = 1;
        this.step = 1;
        this.progress = 0;

        this.visible = true;
        await sleep(1);
        return true;
    }

    async hide() {
        await sleep(350);
        this.visible = false;
        return false;
    }

    setState(state) {
        this.text = (ruMessage[state.state] ? ruMessage[state.state] : state.state);
        this.step = (state.step ? state.step : this.step);
        this.totalSteps = (state.totalSteps > this.totalSteps ? state.totalSteps : this.totalSteps);
        this.progress = (state.progress ? state.progress : this.progress);
    }

    get percentage() {
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
    height: 300px;
}

.text {
    color: yellow;
}

</style>
<style>
.el-progress__text {
    color: lightgreen;
}
</style>
