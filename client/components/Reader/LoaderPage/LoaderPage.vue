<template>
    <div ref="main" class="column no-wrap" style="min-height: 500px">
        <div v-if="mode != 'liberama.top'" class="relative-position">
            <GithubCorner url="https://github.com/bookpauk/liberama" corner-color="#1B695F" git-color="#EBE2C9"></GithubCorner>
        </div>
        <div class="col column justify-center items-center no-wrap overflow-hidden" style="min-height: 230px">
            <span class="greeting"><b>{{ title }}</b></span>
            <div class="q-my-sm"></div>
            <span class="greeting">Добро пожаловать!</span>
            <span class="greeting">Поддерживаются форматы: <b>fb2, html, txt</b> и сжатие: <b>zip, bz2, gz<span v-if="isExternalConverter">, rar</span></b></span>
            <span v-if="isExternalConverter" class="greeting">...а также частично форматы: <b>epub, mobi, rtf, doc, docx, pdf, djvu</b></span>
        </div>

        <div class="col-auto column justify-start items-center no-wrap overflow-hidden">
            <q-input ref="input" v-model="bookUrl" class="full-width q-px-sm" style="max-width: 700px" outlined dense bg-color="white" placeholder="URL книги" @keydown="onInputKeydown">
                <template #append>
                    <q-btn rounded flat style="width: 40px" icon="la la-check" @click="submitUrl" />
                </template>
            </q-input>

            <input id="file" ref="file" type="file" style="display: none;" @change="loadFile" />

            <div class="q-my-sm"></div>
            <q-btn no-caps dense class="q-px-sm" color="primary" size="13px" @click="loadFileClick">
                Загрузить файл с диска
            </q-btn>
            
            <div class="q-my-sm"></div>
            <q-btn no-caps dense class="q-px-sm" color="primary" size="13px" @click="loadBufferClick">
                Из буфера обмена
            </q-btn>

            <div class="q-my-md"></div>
            <!--div v-if="mode == 'omnireader'">
                <div ref="yaShare2" class="ya-share2" 
                    data-services="collections,vkontakte,facebook,odnoklassniki,twitter,telegram"
                    data-description="Чтение fb2-книг онлайн. Загрузка любой страницы интернета одним кликом, синхронизация между устройствами, удобное управление, регистрация не требуется."
                    data-title="Omni Reader - браузерная онлайн-читалка"
                    data-url="https://omnireader.ru">
                </div>
            </div>
            <div class="q-my-sm"></div-->
            <span v-if="mode == 'omnireader'" class="bottom-span clickable" @click="openComments">Отзывы о читалке</span>
            <span v-if="mode == 'omnireader'" class="bottom-span clickable" @click="openOldVersion">Старая версия</span>
        </div>

        <div class="col column justify-end items-center no-wrap overflow-hidden">
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
import vueComponent from '../../vueComponent.js';

import GithubCorner from './GithubCorner/GithubCorner.vue';

import PasteTextPage from './PasteTextPage/PasteTextPage.vue';
import {versionHistory} from '../versionHistory';

const componentOptions = {
    components: {
        GithubCorner,
        PasteTextPage,
    },
};
class LoaderPage {
    _options = componentOptions;

    bookUrl = null;
    loadPercent = 0;
    pasteTextActive = false;

    created() {
        this.commit = this.$store.commit;
    }

    mounted() {
        this.progress = this.$refs.progress;
        /*if (this.mode == 'omnireader')
            Ya.share2(this.$refs.yaShare2);// eslint-disable-line no-undef*/
    }

    activated() {
        this.$refs.input.focus();
    }

    get title() {
        if (this.mode == 'omnireader')
            return 'Omni Reader - браузерная онлайн-читалка.';
        if (this.mode == 'liberama.top')
            return 'Liberama Reader - браузерная онлайн-читалка.';
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

    openHelp(event) {
        this.$emit('do-action', {action: 'help', event});
    }

    openDonate() {
        this.$emit('do-action', {action: 'donate'});
    }
    
    openComments() {
        window.open('http://samlib.ru/comment/b/bookpauk/bookpauk_reader', '_blank');
    }

    openOldVersion() {
        window.open('http://old.omnireader.ru', '_blank');
    }

    onInputKeydown(event) {
        if (event.key == 'Enter') {
            this.submitUrl();
        }
    }

    keyHook(event) {
        if (this.pasteTextActive) {
            return this.$refs.pasteTextPage.keyHook(event);
        }

        const input = this.$refs.input.getNativeElement();
        if (event.type == 'keydown' && document.activeElement !== input) {
            const action = this.$root.readerActionByKeyEvent(event);
            switch (action) {
                case 'help':
                    this.openHelp(event);
                    return true;
            }
        }

        return false;
    }
}

export default vueComponent(LoaderPage);
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