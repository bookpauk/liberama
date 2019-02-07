<template>
    <div class="page">
        <h4>Возможности читалки:</h4>
        <ul>
            <li>загрузка любой страницы интернета</li>
            <li>изменение цвета фона, текста, размер и тип шрифта и прочее</li>
            <li>установка и запоминание текущей позиции и настроек в браузере (в будущем планируется сохранение и на сервер)</li>
            <li>кеширование файлов книг на клиенте и на сервере</li>
            <li>открытие книг с локального диска</li>
            <li>плавный скроллинг текста</li>
            <li>анимация перелистывания (скоро)</li>
            <li>поиск по тексту и копирование фрагмента</li>
            <li>запоминание недавних книг, скачивание книги из читалки в формате fb2</li>
            <li>управление кликом и с клавиатуры</li>
            <li>подключение к интернету не обязательно для чтения книги после ее загрузки</li>
            <li>регистрация не требуется</li>
            <li>поддерживаемые браузеры: Google Chrome, Mozilla Firefox</li>
        </ul>

        <p>В качестве URL можно задавать html-страничку с книгой, либо прямую ссылку 
        на файл из онлайн-библиотеки (например, скопировав адрес ссылки или кнопки "скачать fb2").</p>
        <p>Поддерживаемые форматы: <strong>html, txt, fb2, fb2.zip</strong></p>

        <div v-html="automationHtml"></div>
    </div>
</template>

<script>
//-----------------------------------------------------------------------------
import Vue from 'vue';
import Component from 'vue-class-component';

import Window from '../../../share/Window.vue';

export default @Component({
    components: {
        Window,
    },
})
class HelpPage extends Vue {
    selectedTab = null;

    created() {
        this.config = this.$store.state.config;
    }

    get automationHtml() {
        if (this.config.mode == 'omnireader') {
            return `<p>Вы можете добавить в свой браузер закладку, указав в ее свойствах вместо адреса следующий код:
                    <br><strong>javascript:location.href='http://omnireader.ru/?url='+location.href;</strong>
                    <br>Тогда, нажав на получившуюся кнопку на любой странице интернета, вы автоматически откроете ее в Omni Reader.</p>`;
        } else {
            return '';
        }
    }
}
//-----------------------------------------------------------------------------
</script>

<style scoped>
.page {
    flex: 1;
    padding: 15px;
    overflow-y: auto;
    font-size: 150%;
}

h4 {
    margin: 0;
}
</style>
