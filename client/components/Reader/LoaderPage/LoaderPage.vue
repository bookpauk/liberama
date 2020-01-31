<template>
    <div ref="main" class="fit column no-wrap" style="min-height: 500px">
        <GithubCorner url="https://github.com/bookpauk/liberama" cornerColor="#1B695F" gitColor="EBE2C9"></GithubCorner>
        <div class="col column justify-center items-center no-wrap" style="min-height: 150px">
            <span class="greeting"><b>{{ title }}</b></span>
            <div class="q-my-md"></div>
            <span class="greeting">Добро пожаловать!</span>
            <span class="greeting">Поддерживаются форматы: <b>fb2, html, txt</b> и сжатие: <b>zip, bz2, gz</b></span>
            <span v-if="isExternalConverter" class="greeting">...а также форматы: <b>rtf, doc, docx, pdf, epub, mobi</b></span>
        </div>

        <div class="col column justify-start items-center no-wrap" style="min-height: 300px">
            <!--el-input ref="input1" placeholder="URL книги" v-model="bookUrl">
                <el-button slot="append" icon="el-icon-check" @click="submitUrl"></el-button>
            </el-input-->
            <q-input ref="input" class="fit" style="max-width: 700px" outlined dense bg-color="white" v-model="bookUrl" placeholder="URL книги">
                <template v-slot:append>
                    <q-btn round dense flat icon="done" @click="submitUrl"/>
                </template>
            </q-input>

            <div class="q-my-md"></div>
            <input type="file" id="file" ref="file" @change="loadFile" style='display: none;'/>

            <el-button size="mini" @click="loadFileClick">
                Загрузить файл с диска
            </el-button>
            <div class="q-my-md"></div>
            <el-button size="mini" @click="loadBufferClick">
                Из буфера обмена
            </el-button>

            <div class="q-my-md"></div>
            <div v-if="mode == 'omnireader'">
                <div ref="yaShare2" class="ya-share2" 
                    data-services="collections,vkontakte,facebook,odnoklassniki,twitter,telegram"
                    data-description="Чтение fb2-книг онлайн. Загрузка любой страницы интернета одним кликом, синхронизация между устройствами, удобное управление, регистрация не требуется."
                    data-title="Omni Reader - браузерная онлайн-читалка"
                    data-url="https://omnireader.ru">
                </div>
            </div>
            <div class="q-my-sm"></div>
            <span v-if="mode == 'omnireader'" class="bottom-span clickable" @click="openComments">Отзывы о читалке</span>
            <span v-if="mode == 'omnireader'" class="bottom-span clickable" @click="openOldVersion">Старая версия</span>
        </div>

        <div class="col column justify-end items-center no-wrap">
            <span class="bottom-span clickable" @click="openHelp">Справка</span>
            <span class="bottom-span clickable" @click="openDonate">Помочь проекту</span>

            <span v-if="version == clientVersion" class="bottom-span">v{{ version }}</span>
            <span v-else class="bottom-span">Версия сервера {{ version }}, версия клиента {{ clientVersion }}, необходимо обновить страницу</span>
        </div>

        <PasteTextPage v-if="pasteTextActive" ref="pasteTextPage" @paste-text-toggle="pasteTextToggle" @load-buffer="loadBuffer"></PasteTextPage>
    </div>
</template>

<script>
//-----------------------------------------------------------------------------
import Vue from 'vue';
import Component from 'vue-class-component';
import GithubCorner from './GithubCorner/GithubCorner.vue';

import PasteTextPage from './PasteTextPage/PasteTextPage.vue';
import {versionHistory} from '../versionHistory';

export default @Component({
    components: {
        GithubCorner,
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
        return this.$store.state.config.version;
    }

    get isExternalConverter() {
        return this.$store.state.config.useExternalBookConverter;
    }

    get clientVersion() {
        let v = versionHistory[0].header;
        v = v.split(' ')[0];
        return v;
    }

    submitUrl() {
        if (this.bookUrl) {
            this.$emit('load-book', {url: this.bookUrl, force: true});
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

    openOldVersion() {
        window.open('http://old.omnireader.ru', '_blank');
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
.greeting {
    font-size: 120%;
    line-height: 160%;
}

.clickable {
    color: blue;
    text-decoration: underline;
    cursor: pointer;
}

.bottom-span {
    font-size: 70%;
    margin-bottom: 10px;
}
</style>