<template>
    <q-dialog v-model="active" no-route-dismiss>
        <div class="column bg-white no-wrap">
            <div class="header row">
                <div class="caption col row items-center q-ml-md">
                    <slot name="header"></slot>
                </div>
                <div class="close-icon column justify-center items-center">
                    <q-btn v-close-popup flat round dense>
                        <q-icon name="la la-times" size="18px"></q-icon>
                    </q-btn>
                </div>
            </div>

            <div class="col q-mx-md">
                <slot></slot>
            </div>

            <div class="row justify-end q-pa-md">
                <slot name="footer"></slot>
            </div>
        </div>
    </q-dialog>
</template>

<script>
//-----------------------------------------------------------------------------
import vueComponent from '../vueComponent.js';

class Dialog {
    _props = {
        modelValue: Boolean,
    };

    get active() {
        return this.modelValue;
    }

    set active(value) {
        this.$emit('update:modelValue', value);
    }
}

export default vueComponent(Dialog);
//-----------------------------------------------------------------------------
</script>

<style scoped>
.header {
    height: 50px;
}

.caption {
    font-size: 110%;
    overflow: hidden;
}

.close-icon {
    width: 50px;
}
</style>