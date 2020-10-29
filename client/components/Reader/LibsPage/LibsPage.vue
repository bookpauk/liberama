<template>
    <div class="hidden"></div>
</template>

<script>
//-----------------------------------------------------------------------------
import Vue from 'vue';
import Component from 'vue-class-component';

import Window from '../../share/Window.vue';
import * as utils from '../../../share/utils';
//import rstore from '../../../store/modules/reader';

export default @Component({
    components: {
        Window
    },
    watch: {
        libs: function() {
            this.sendLibs();
        },
    }    
})
class LibsPage extends Vue {
    created() {
        this.popupWindow = null;
        this.commit = this.$store.commit;
        this.messageListener = null;
        //this.commit('reader/setLibs', rstore.libsDefaults);
    }

    init() {
        if (this.mode != 'liberama.top')
            return;

        this.childReady = false;
        const subdomain = (window.location.protocol != 'http:' ? 'b.' : '');
        this.origin = `http://${subdomain}${window.location.host}`;

        this.messageListener = (event) => {
            if (event.origin !== this.origin)
                return;

            //console.log(event.data);

            this.recvMessage(event.data);
        };

        this.popupWindow = window.open(`${this.origin}/#/external-libs`);

        if (this.popupWindow) {

            window.addEventListener('message', this.messageListener);

            //Проверка закрытия окна
            (async() => {
                while(this.popupWindow) {
                    if (this.popupWindow && this.popupWindow.closed)
                        this.close();
                    await utils.sleep(1000);
                }
            })();

            //Установление связи с окном
            (async() => {
                let i = 0;
                while(!this.childReady && this.popupWindow && i < 100) {
                    this.sendMessage({type: 'mes', data: 'hello'});
                    await utils.sleep(100);
                    i++;
                }
                this.sendLibs();
            })();
        }
    }

    recvMessage(d) {
        if (d.type == 'mes') {
            switch(d.data) {
                case 'ready':
                    this.childReady = true;                    
                    break;
            }
        } else if (d.type == 'libs') {
            this.commit('reader/setLibs', d.data);
        } else if (d.type == 'close') {
            this.close();
        } else if (d.type == 'submitUrl') {
            this.$emit('load-book', d.data);
            this.sendMessage({type: 'notify', data: 'Ссылка передана в читалку'});
        }
    }

    sendMessage(d) {
        if (this.popupWindow)
            this.popupWindow.postMessage(Object.assign({}, {from: 'LibsPage'}, d), this.origin);
    }

    done() {
        window.removeEventListener('message', this.messageListener);
        if (this.popupWindow) {
            this.popupWindow.close();
            this.popupWindow = null;
        }
    }

    get mode() {
        return this.$store.state.config.mode;
    }

    get libs() {
        return this.$store.state.reader.libs;
    }

    sendLibs() {
        this.sendMessage({type: 'libs', data: this.libs});
    }

    close() {
        this.$emit('libs-close');
    }
}
//-----------------------------------------------------------------------------
</script>

<style scoped>
.separator {
    height: 1px;
    background-color: #A0A0A0;
}
</style>
