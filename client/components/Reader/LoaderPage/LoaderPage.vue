<template>
    <div ref="main" class="main">
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
            <input type="file" id="file" ref="file" @change="loadFile" style='display: none;'/>
            <el-button size="mini" @click="loadFileClick">
                Загрузить файл с диска
            </el-button>
            <div class="space"></div>
            <span v-if="config.mode == 'omnireader'" class="bottom-span clickable" @click="openComments">Комментарии</span>
        </div>
        <div class="part bottom">
            <span class="bottom-span clickable" @click="openHelp">Справка</span>
            <span class="bottom-span clickable" @click="openDonate">Помочь проекту</span>
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
    loadPercent = 0;

    created() {
        this.commit = this.$store.commit;
        this.config = this.$store.state.config;
    }

    mounted() {
        this.progress = this.$refs.progress;
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
        if (file)
            this.$emit('load-file', {file});
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