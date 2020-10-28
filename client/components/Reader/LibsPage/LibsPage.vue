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
        this.popupWindow = window.open(`http://${window.location.host}/?p=external-libs#/external-libs`);
        if (this.popupWindow) {
            //Проверка закрытия окна
            (async() => {
                while(this.popupWindow) {
                    if (this.popupWindow && this.popupWindow.closed)
                        this.close();
                    await utils.sleep(1000);
                }
            })();
        }
        this.loadLibs();
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
