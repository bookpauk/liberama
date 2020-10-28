<template>
    <div></div>
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
            this.loadLibs();
        },
    }    
})
class LibsPage extends Vue {
    created() {
        this.popupWindow = null;
        this.commit = this.$store.commit;
        //this.commit('reader/setLibs', rstore.libsDefaults);
    }

    init() {
        const subdomain = (window.location.protocol != 'http:' ? 'b.' : '');
        const origin = `http://${subdomain}${window.location.host}`;

        this.popupWindow = window.open(`${origin}/?p=external-libs#/external-libs`);

        if (this.popupWindow) {

            //Проверка закрытия окна
            (async() => {
                while(this.popupWindow) {
                    if (this.popupWindow && this.popupWindow.closed)
                        this.close();
                    await utils.sleep(1000);
                }
            })();

            window.addEventListener('message', (event) => {
                if (event.origin !== origin)
                    return;
                console.log(event.data);
            }, false);

            (async() => {
                while(this.popupWindow) {
                    this.popupWindow.postMessage({from: 'LibsPage', type: 'mes', data: 'hello'}, origin);
                    await utils.sleep(1000);
                }
            })();

            this.loadLibs();
        }
    }

    done() {
        if (this.popupWindow) {
            this.popupWindow.close();
            this.popupWindow = null;
        }
    }

    get libs() {
        return this.$store.state.reader.libs;
    }

    loadLibs() {
    }

/*    submitUrl() {
        if (this.bookUrl) {
            this.$emit('load-book', {url: this.addProtocol(this.bookUrl), force: true});
            this.bookUrl = '';
        }
    }*/

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
