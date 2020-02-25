<template>
    <q-dialog v-model="dialog" @hide="onHide">
        <slot></slot>

        <div v-show="alertType" class="column bg-white">
            <div class="header row">
                <div class="caption col row items-center q-ml-md">
                    <q-icon v-show="caption" class="text-warning q-mr-sm" name="las la-exclamation-circle" size="28px"></q-icon>
                    <div v-html="caption"></div>
                </div>
                <div class="close-icon column justify-center items-center">
                    <q-btn flat round dense v-close-popup>
                        <q-icon name="la la-times" size="18px"></q-icon>
                    </q-btn>
                </div>
            </div>

            <div class="col q-mx-md">
                <div v-html="message"></div>
            </div>

            <div class="buttons row justify-end q-pa-md">
                <q-btn class="q-px-md" dense no-caps @click="okClick" v-close-popup>OK</q-btn>
            </div>
        </div>
    </q-dialog>
</template>

<script>
//-----------------------------------------------------------------------------
import Vue from 'vue';
import Component from 'vue-class-component';

//import * as utils from '../../share/utils';

export default @Component({
})
class StdDialog extends Vue {
    caption = '';
    message = '';
    dialog = false;
    alertType = false;

    created() {
    }

    init(message, caption) {
        this.caption = caption;
        this.message = message;

        this.ok = false;        
        this.alertType = false;
    }

    onHide() {
        if (this.hideTrigger) {
            this.hideTrigger();
            this.hideTrigger = null;
        }
    }

    okClick() {
        this.ok = true;
    }

    alert(message, caption) {
        return new Promise((resolve) => {
            this.init(message, caption);

            this.hideTrigger = () => {
                if (this.ok) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            };

            this.alertType = true;
            this.dialog = true;
        });
    }
}
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

.buttons {
    height: 60px;
}

</style>