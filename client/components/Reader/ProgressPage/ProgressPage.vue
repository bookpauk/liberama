<template>
    <div v-show="visible" class="column justify-center items-center z-max" style="background-color: rgba(0, 0, 0, 0.8)">
        <div class="column justify-start items-center" style="height: 250px">
            <q-circular-progress
                show-value
                instant-feedback
                font-size="13px"
                :value="percentage"
                size="100px"
                :thickness="0.11"
                color="green-7"
                track-color="grey-4"
                class="q-ma-md"
            >
                <span class="text-yellow">{{ percentage }}%</span>
            </q-circular-progress>

            <p class="text-yellow">{{ text }}</p>
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
    'queue': 'очередь',
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
        this.text = '';
        this.totalSteps = 1;
        this.step = 1;
        this.progress = 0;

        this.visible = true;
    }

    hide() {
        this.visible = false;
        this.text = '';
    }

    setState(state) {
        if (state.state) {
            if (state.state == 'queue') {
                this.text = (state.place ? 'Номер в очереди: ' + state.place : '');
            } else {
                this.text = (ruMessage[state.state] ? ruMessage[state.state] : state.state);
            }
        }
        this.step = (state.step ? state.step : this.step);
        this.totalSteps = (state.totalSteps > this.totalSteps ? state.totalSteps : this.totalSteps);
        this.progress = state.progress || 0;
    }

    get percentage() {
        return Math.round(((this.step - 1)/this.totalSteps + this.progress/(100*this.totalSteps))*100);
    }
}
//-----------------------------------------------------------------------------
</script>
