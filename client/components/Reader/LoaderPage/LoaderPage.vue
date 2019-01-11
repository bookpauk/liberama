<template>
    <div class="main">
        <div class="part">
            <span class="greeting bold-font">{{ title }}</span>
            <span class="greeting">Добро пожаловать!</span>
            <span class="greeting">Поддерживаются форматы: fb2, fb2.zip, html, txt</span>
        </div>
        <div class="part center">
            <el-input ref="input" placeholder="URL книги" v-model="bookUrl">
                <el-button slot="append" icon="el-icon-check" @click="submitUrl"></el-button>
            </el-input>
            <div class="space"></div>
            <el-button size="mini" @click="loadFle">
                Загрузить файл
            </el-button>
        </div>
        <div class="part bottom">
            <span v-if="config.mode == 'omnireader'" class="bottom-span clickable" @click="openComments">Комментарии</span>
            <span class="bottom-span clickable" @click="openHelp">Справка</span>
            <span class="bottom-span">{{ version }}</span>
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

    activated() {
        this.$refs.input.focus();
    }

    get title() {
        if (this.config.mode == 'omnireader')
            return 'Omni Reader - браузерная онлайн-читалка.';
        return 'Универсальная читалка книг и ресурсов интернета.';

    }

    get version() {
        return `v${this.config.version}`;
    }

    submitUrl() {
        if (this.bookUrl)
            //loadUrl()
        ;
    }

    loadFle() {
    }

    openHelp() {
    }

    openComments() {
        window.open('http://samlib.ru/comment/b/bookpauk/bookpauk_reader', '_blank');
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

.clickable {
    color: blue;
    text-decoration: underline;
    cursor: pointer;
}

.center {
    justify-content: flex-start;
    padding: 0 10px 0 10px;
}

.bottom {
    justify-content: flex-end;
}

.bottom-span {
    font-size: 70%;
    margin-bottom: 10px;
}

.el-input {
    max-width: 700px;
}

.space {
    height: 20px;
}
</style>