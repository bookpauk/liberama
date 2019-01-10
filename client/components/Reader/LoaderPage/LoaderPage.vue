<template>
    <div class="main">
        <div class="part">
            <span class="greeting bold-font">{{ title }}</span>
            <span class="greeting">Добро пожаловать!</span>
            <span class="greeting">Поддерживаются форматы: fb2, fb2.zip, html, txt</span>
        </div>
        <div class="part center">
            <el-input ref="input" placeholder="URL книги" v-model="bookUrl">
                <el-button slot="append" icon="el-icon-search" @click="submitUrl"></el-button>
            </el-input>
        </div>
        <div class="part bottom">
        </div>
    </div>
</template>

<script>
//-----------------------------------------------------------------------------
import Vue from 'vue';
import Component from 'vue-class-component';

export default @Component({
})
class LoaderPage extends Vue {
    bookUrl = null;

    created() {
        this.commit = this.$store.commit;
        this.dispatch = this.$store.dispatch;
        this.config = this.$store.state.config;
    }

    mounted() {
    }

    activated() {
        this.$refs.input.focus();
    }

    get title() {
        if (this.config.mode == 'omnireader')
            return 'Omni Reader - браузерная онлайн-читалка.';
        return 'Универсальная читалка книг и ресурсов интернета.';

    }

    submitUrl() {
        if (this.bookUrl)
            //loadUrl()
        ;
    }

    keyHook(event) {
        //недостатки сторонних ui
        if (document.activeElement == this.$refs.input.$refs.input && event.type == 'keyup' && event.key == 'Enter')
            this.submitUrl();
    }
}
//-----------------------------------------------------------------------------
</script>
<style scoped>
.main {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.part {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}

.greeting {
    font-size: 130%;
    line-height: 170%;
}

.bold-font {
    font-weight: bold;
}

.center {
    justify-content: flex-start;
    padding: 0 5px 0 5px;
}

.bottom {
    justify-content: flex-end;
}

.el-input {
    max-width: 600px;
}
</style>