<template>
    <q-input outlined dense
        v-model="filteredValue"
        input-style="text-align: center"
        class="no-mp"
        :class="(error ? 'error' : '')"
    >
        <template v-slot:prepend>
            <q-icon name="la la-minus-circle" class="button" v-ripple @click="minus"/>
        </template>
        <template v-slot:append>
            <q-icon name="la la-plus-circle" class="button" v-ripple @click="plus"/>
        </template>
    </q-input>
</template>

<script>
//-----------------------------------------------------------------------------
import Vue from 'vue';
import Component from 'vue-class-component';

const NumInputProps = Vue.extend({
    props: {
        value: Number,
        min: { type: Number, default: -Number.MAX_VALUE },
        max: { type: Number, default: Number.MAX_VALUE },
        step: { type: Number, default: 1 },
    }
})

export default @Component({
    watch: {
        filteredValue: function(newValue) {
            if (this.validate(newValue)) {
                this.error = false;
                this.$emit('input', Number.parseFloat(newValue));
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
        this.mask = '#'.repeat(this.max.toString().length);
        this.filteredValue = this.value;
    }

    validate(value) {
        let n = Number.parseFloat(value);
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
    color: #616161;
}

.button:hover {
    background-color: #efebe9;
}

.error {
    background-color: #ffabab;
    border-radius: 3px;
}
</style>