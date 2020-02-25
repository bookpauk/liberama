<template>
    <q-dialog ref="dialog" v-model="active" @show="onShow" @hide="onHide">
        <slot></slot>

        <!--------------------------------------------------->
        <div v-show="type == 'alert'" class="column bg-white">
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
                <q-btn class="q-px-md" dense no-caps @click="okClick">OK</q-btn>
            </div>
        </div>

        <!--------------------------------------------------->
        <div v-show="type == 'confirm'" class="column bg-white">
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
                <q-btn class="q-px-md q-ml-sm" dense no-caps v-close-popup>Отмена</q-btn>
                <q-btn class="q-px-md q-ml-sm" color="primary" dense no-caps @click="okClick">OK</q-btn>
            </div>
        </div>

        <!--------------------------------------------------->
        <div v-show="type == 'prompt'" class="column bg-white">
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
                <q-input ref="input" class="q-mt-xs" outlined dense v-model="inputValue"/>
                <div class="error"><span v-show="error != ''">{{ error }}</span></div>
            </div>

            <div class="buttons row justify-end q-pa-md">
                <q-btn class="q-px-md q-ml-sm" dense no-caps v-close-popup>Отмена</q-btn>
                <q-btn class="q-px-md q-ml-sm" color="primary" dense no-caps @click="okClick">OK</q-btn>
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
    watch: {
        inputValue: function(newValue) {
            this.validate(newValue);
        },
    }
})
class StdDialog extends Vue {
    caption = '';
    message = '';
    active = false;
    type = '';
    inputValue = '';
    error = '';

    created() {
        if (this.$root.addKeyHook) {
            this.$root.addKeyHook(this.keyHook);
        }
    }

    init(message, caption) {
        this.caption = caption;
        this.message = message;

        this.ok = false;        
        this.type = '';
        this.inputValidator = null;
        this.inputValue = '';
        this.error = '';
    }

    onHide() {
        if (this.hideTrigger) {
            this.hideTrigger();
            this.hideTrigger = null;
        }
    }

    onShow() {
        if (this.type == 'prompt') {
            this.enableValidator = true;
            if (this.inputValue)
                this.validate(this.inputValue);
            this.$refs.input.focus();
        }
    }

    validate(value) {
        if (!this.enableValidator)
            return false;

        if (this.inputValidator) {
            const result = this.inputValidator(value);
            if (result !== true) {
                this.error = result;
                return false;
            }
        }
        this.error = '';
        return true;
    }

    okClick() {
        if (this.type == 'prompt' && !this.validate(this.inputValue)) {
            this.$refs.dialog.shake();
            return;
        }
        this.ok = true;
        this.$refs.dialog.hide();
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

            this.type = 'alert';
            this.active = true;
        });
    }

    confirm(message, caption) {
        return new Promise((resolve) => {
            this.init(message, caption);

            this.hideTrigger = () => {
                if (this.ok) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            };

            this.type = 'confirm';
            this.active = true;
        });
    }

    prompt(message, caption, opts) {
        return new Promise((resolve) => {
            this.enableValidator = false;
            this.init(message, caption);

            this.hideTrigger = () => {
                if (this.ok) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            };

            this.type = 'prompt';
            if (opts) {
                this.inputValidator = opts.inputValidator || null;
                this.inputValue = opts.inputValue || '';
            }
            this.active = true;
        });
    }

    keyHook(event) {
        if (this.active && event.code == 'Enter') {
            this.okClick();
            event.stopPropagation();
            event.preventDefault();
        }
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

.error {
    height: 20px;
    font-size: 80%;
    color: red;
}
</style>