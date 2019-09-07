<template>
    <div ref="main" class="main">
        <div class="part">
            <span class="greeting bold-font">{{ title }}</span>
            <div class="space"></div>
            <span class="greeting">Добро пожаловать!</span>
            <span class="greeting">Поддерживаются форматы: <b>fb2, html, txt</b> и сжатие: <b>zip, bz2, gz</b></span>
            <span v-if="isExternalConverter" class="greeting">...а также форматы: <b>rtf, doc, docx, pdf, epub, mobi</b></span>
        </div>

        <div class="part center">
            <el-input ref="input" placeholder="URL книги" v-model="bookUrl">
                <el-button slot="append" icon="el-icon-check" @click="submitUrl"></el-button>
            </el-input>
            <div class="space"></div>
            <input type="file" id="file" ref="file" @change="loadFile" style='display: none;'/>
            <el-button size="mini" @click="loadFileClick">
                Загрузить файл с диска
            </el-button>
            <div class="space"></div>
            <el-button size="mini" @click="loadBufferClick">
                Из буфера обмена
            </el-button>
            <div class="space"></div>
            <div class="space"></div>
            <div v-if="mode == 'omnireader'" ref="yaShare2" class="ya-share2" 
                data-services="collections,vkontakte,facebook,odnoklassniki,twitter,telegram"
                data-description="Чтение fb2-книг онлайн. Загрузка любой страницы интернета одним кликом, синхронизация между устройствами, удобное управление, регистрация не требуется."
                data-title="Omni Reader - браузерная онлайн-читалка"
                data-url="https://omnireader.ru">
            </div>
            <div class="space"></div>
            <span v-if="mode == 'omnireader'" class="bottom-span clickable" @click="openComments">Отзывы о читалке</span>
        </div>

        <div class="part bottom">
            <span class="bottom-span clickable" @click="openHelp">Справка</span>
            <span class="bottom-span clickable" @click="openDonate">Помочь проекту</span>
            <span class="bottom-span">{{ version }}</span>
        </div>

        <PasteTextPage v-if="pasteTextActive" ref="pasteTextPage" @paste-text-toggle="pasteTextToggle" @load-buffer="loadBuffer"></PasteTextPage>
    </div>
</template>

<script>
//-----------------------------------------------------------------------------
import Vue from 'vue';
import Component from 'vue-class-component';
import PasteTextPage from './PasteTextPage/PasteTextPage.vue';

export default @Component({
    components: {
        PasteTextPage,
    },
})
class LoaderPage extends Vue {
    bookUrl = null;
    loadPercent = 0;
    pasteTextActive = false;

    created() {
        this.commit = this.$store.commit;
    }

    mounted() {
        this.progress = this.$refs.progress;
        if (this.mode == 'omnireader')
            Ya.share2(this.$refs.yaShare2);// eslint-disable-line no-undef
    }

    activated() {
        this.$refs.input.focus();
    }

    get title() {
        if (this.mode == 'omnireader')
            return 'Omni Reader - браузерная онлайн-читалка.';
        return 'Универсальная читалка книг и ресурсов интернета.';

    }

    get mode() {
        return this.$store.state.config.mode;
    }

    get version() {
        return `v${this.$store.state.config.version}`;
    }

    get isExternalConverter() {
        return this.$store.state.config.useExternalBookConverter;
    }

    submitUrl() {
        if (this.bookUrl) {
            this.$emit('load-book', {url: this.bookUrl});
            this.bookUrl = '';
        }
    }

    loadFileClick() {
        this.$refs.file.click();
    }

    loadFile() {
        const file = this.$refs.file.files[0];        
        this.$refs.file.value = '';
        if (file)
            this.$emit('load-file', {file});
    }

    loadBufferClick() {
        this.pasteTextToggle();
    }

    loadBuffer(opts) {
        if (opts.buffer.length) {
            const file = new File([opts.buffer], 'dummyName-PasteFromClipboard');
            this.$emit('load-file', {file});
        }
    }

    pasteTextToggle() {
        this.pasteTextActive = !this.pasteTextActive;
    }

    openHelp() {
        this.$emit('help-toggle');
    }

    openDonate() {
        this.$emit('donate-toggle');
    }
    
    openComments() {
        window.open('http://samlib.ru/comment/b/bookpauk/bookpauk_reader', '_blank');
    }

    keyHook(event) {
        if (this.pasteTextActive) {
            return this.$refs.pasteTextPage.keyHook(event);
        }

        //недостатки сторонних ui
        const input = this.$refs.input.$refs.input;
        if (document.activeElement === input && event.type == 'keydown' && event.code == 'Enter') {
            this.submitUrl();
        }

        if (event.type == 'keydown' && (event.code == 'F1' || (document.activeElement !== input && event.code == 'KeyH'))) {
            this.$emit('help-toggle');
            event.preventDefault();
            event.stopPropagation();
            return true;
        }

        if (event.type == 'keydown' && (document.activeElement !== input && event.code == 'KeyQ')) {
            this.$emit('tool-bar-toggle');
            event.preventDefault();
            event.stopPropagation();
            return true;
        }
    }
}
//-----------------------------------------------------------------------------
</script>
<style scoped>
.main {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 400px;
}

.part {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}

.greeting {
    font-size: 120%;
    line-height: 160%;
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