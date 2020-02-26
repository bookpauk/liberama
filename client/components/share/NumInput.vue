<template>
    <q-input outlined dense
        v-model="filteredValue"
        input-style="text-align: center"
        class="no-mp"
        :class="(error ? 'error' : '')"
        :disable="disable"
    >
        <slot></slot>
        <template v-slot:prepend>
            <q-icon :class="(validate(value - step) ? '' : 'disable')" 
                name="la la-minus-circle" 
                class="button" 
                v-ripple="validate(value - step)" 
                @click="minus"
                @mousedown.prevent.stop="onMouseDown($event, 'minus')"
                @mouseup.prevent.stop="onMouseUp"
                @mouseout.prevent.stop="onMouseUp"
                @touchstart.stop="onTouchStart($event, 'minus')"
                @touchend.stop="onTouchEnd"
                @touchcancel.prevent.stop="onTouchEnd"
            />
        </template>
        <template v-slot:append>
            <q-icon :class="(validate(value + step) ? '' : 'disable')"
                name="la la-plus-circle"
                class="button"
                v-ripple="validate(value + step)"
                @click="plus"
                @mousedown.prevent.stop="onMouseDown($event, 'plus')"
                @mouseup.prevent.stop="onMouseUp"
                @mouseout.prevent.stop="onMouseUp"
                @touchstart.stop="onTouchStart($event, 'plus')"
                @touchend.stop="onTouchEnd"
                @touchcancel.prevent.stop="onTouchEnd"
            />
        </template>
    </q-input>
</template>

<script>
//-----------------------------------------------------------------------------
import Vue from 'vue';
import Component from 'vue-class-component';

import * as utils from '../../share/utils';

const NumInputProps = Vue.extend({
    props: {
        value: Number,
        min: { type: Number, default: -Number.MAX_VALUE },
        max: { type: Number, default: Number.MAX_VALUE },
        step: { type: Number, default: 1 },
        digits: { type: Number, default: 0 },
        disable: Boolean
    }
});

export default @Component({
    watch: {
        filteredValue: function(newValue) {
            if (this.validate(newValue)) {
                this.error = false;
                this.$emit('input', this.string2number(newValue));
            } else {
                this.error = true;
            }
        },
        value: function(newValue) {
            this.filteredValue = newValue;
        },
    }
})
class NumInput extends NumInputProps {
    filteredValue = 0;
    error = false;

    created() {
        this.filteredValue = this.value;
    }

    string2number(value) {
        return Number.parseFloat(Number.parseFloat(value).toFixed(this.digits));
    }

    validate(value) {
        let n = this.string2number(value);
        if (isNaN(n))
            return false;
        if (n < this.min)
            return false;
        if (n > this.max)
            return false;
        return true;
    }

    plus() {
        const newValue = this.value + this.step;
        if (this.validate(newValue))
            this.filteredValue = newValue;
    }

    minus() {
        const newValue = this.value - this.step;
        if (this.validate(newValue))
            this.filteredValue = newValue;
    }

    onMouseDown(event, way) {
        this.startClickRepeat = true;
        this.clickRepeat = false;

        if (event.button == 0) {
            (async() => {
                await utils.sleep(300);
                if (this.startClickRepeat) {
                    this.clickRepeat = true;
                    while (this.clickRepeat) {
                        if (way == 'plus') {
                            this.plus();
                        } else {
                            this.minus();
                        }
                        await utils.sleep(50);
                    }
                }
            })();
        }
    }

    onMouseUp() {
        if (this.inTouch)
            return;
        this.startClickRepeat = false;
        this.clickRepeat = false;
    }

    onTouchStart(event, way) {
        if (!this.$isMobileDevice)
            return;
        if (event.touches.length == 1) {
            this.inTouch = true;
            this.onMouseDown({button: 0}, way);
        }
    }

    onTouchEnd() {
        if (!this.$isMobileDevice)
            return;
        this.inTouch = false;
        this.onMouseUp();
    }
}
//-----------------------------------------------------------------------------
</script>

<style scoped>
.no-mp {
    margin: 0;
    padding: 0;
}

.button {
    font-size: 130%;
    border-radius: 20px;
    color: #bbb;
    cursor: pointer;
}

.button:hover {
    color: #616161;
    background-color: #efebe9;
}

.error {
    background-color: #ffabab;
    border-radius: 3px;
}

.disable, .disable:hover {
    cursor: not-allowed;
    color: #bbb;
    background-color: white;
}
</style>