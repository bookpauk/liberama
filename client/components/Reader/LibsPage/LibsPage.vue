<template>
    <Window ref="window" @close="close">
        <template slot="header">
            Библиотеки <span v-show="startLink">(выбрана {{ startLink }})</span>
        </template>

        <div class="col column" style="min-width: 600px">
            <div class="row items-center q-px-sm" style="height: 50px">
                <q-select class="q-mr-sm" v-model="externalLib" :options="externalLibOptions"
                    style="width: 250px"
                    dropdown-icon="la la-angle-down la-sm"
                    rounded outlined dense emit-value map-options
                >
                    <template v-slot:prepend>
                        <q-btn class="q-mr-xs" round dense color="blue" icon="la la-plus" size="12px"/>
                        <q-btn round dense color="blue" icon="la la-bars" size="12px"/>
                    </template>
                </q-select>
                <q-select class="q-mr-sm" v-model="startPageModel" :options="startPageOptions" style="width: 50px"
                    dropdown-icon="la la-angle-down la-sm"
                    rounded outlined dense emit-value map-options
                />                
                <q-input ref="input" class="col" rounded outlined dense bg-color="white" v-model="bookUrl" placeholder="Скопируйте сюда URL книги" @focus="onInputFocus">
                    <template v-slot:prepend>
                        <q-btn round dense color="blue" icon="la la-angle-double-down" @click="openBookUrlInFrame" size="12px"/>
                    </template>
                </q-input>
                <q-btn class="q-mx-sm" rounded color="green-5" no-caps size="14px">Открыть</q-btn>
            </div>
            <div class="separator"></div>
            <iframe class="col fit" :src="frameSrc" frameborder="0"></iframe>
        </div>
    </Window>
</template>

<script>
//-----------------------------------------------------------------------------
import Vue from 'vue';
import Component from 'vue-class-component';

import Window from '../../share/Window.vue';

export default @Component({
    components: {
        Window
    },
    watch: {
    }    
})
class LibsPage extends Vue {
    startLink = '';
    frameSrc = '';
    bookUrl = '';

    created() {
        this.commit = this.$store.commit;
        this.loadLibs();
    }

    init() {
        this.$refs.window.init();
        if (!this.frameSrc)
            this.frameSrc = this.libs.startLink;
    }

    get libs() {
        return this.$store.state.reader.libs;
    }

    loadLibs() {
        const libs = this.libs;
        this.startLink = this.removeProtocol(libs.startLink);
    }

    openBookUrlInFrame() {
        if (this.bookUrl)
            this.frameSrc = this.addProtocol(this.bookUrl);
    }

    addProtocol(url) {
        if ((url.indexOf('http://') != 0) && (url.indexOf('https://') != 0))
            return 'http://' + url;
        return url;
    }

    removeProtocol(url) {
        return url.replace(/(^\w+:|^)\/\//, '');
    }

    onInputFocus() {
        this.$refs.input.select();
    }

    close() {
        this.$emit('do-action', {action: 'libs'});
    }

    keyHook() {
        if (event.type == 'keydown' && (event.code == 'Escape')) {
            this.close();
        }
        return true;
    }

}
//-----------------------------------------------------------------------------
</script>

<style scoped>
.separator {
    height: 1px;
    background-color: #A0A0A0;
}</style>
