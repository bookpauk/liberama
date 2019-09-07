<template>
    <div class="page">
        <h4>Возможности читалки:</h4>
        <ul>
            <li>загрузка любой страницы интернета</li>
            <li>изменение цвета фона, текста, размер и тип шрифта и прочее</li>
            <li>установка и запоминание текущей позиции и настроек в браузере и на сервере</li>
            <li>синхронизация данных (настроек и читаемых книг) между различными устройствами</li>
            <li>кэширование файлов книг на клиенте и на сервере</li>
            <li>открытие книг с локального диска</li>
            <li>плавный скроллинг текста</li>
            <li>анимация перелистывания</li>
            <li>поиск по тексту и копирование фрагмента</li>
            <li>запоминание недавних книг, скачивание книги из читалки в формате fb2</li>
            <li>управление кликом и с клавиатуры</li>
            <li>подключение к интернету не обязательно для чтения книги после ее загрузки</li>
            <li>регистрация не требуется</li>
            <li>поддерживаемые браузеры: Google Chrome, Mozilla Firefox последних версий</li>
        </ul>

        <p>В качестве URL книги можно задавать html-страничку с книгой, либо прямую ссылку 
        на файл из онлайн-библиотеки (например, скопировав адрес ссылки или кнопки "скачать fb2").</p>
        <p>Поддерживаемые форматы: <b>fb2, fb2.zip, html, txt</b> и другие.</p>

        <p>Для автономной загрузки читалки (без интернета):<br>
        В Google Chrome можно установить флаг <span class="clickable" @click="copyText('chrome://flags/#show-saved-copy', 'Ссылка на флаг успешно скопирована в буфер обмена. Можно открыть ее в новой вкладке.')">chrome://flags/#show-saved-copy</span>
           в значение "Primary". В этом случае на стандартной странице "нет соединения" появится кнопка для автономной загрузки сайта из кэша.<br>
        В Mozilla Firefox в автономном режиме сайт загружается из кэша автоматически. Если этого не происходит, можно установить опцию
        "Веб-разработка" -> "Работать автономно".</p>

        <div v-show="mode == 'omnireader'">
            <p>Вы также можете добавить в свой браузер закладку, указав в ее свойствах вместо адреса следующий код:
                <br><span class="clickable" @click="copyText('javascript:location.href=\'https://omnireader.ru/?url=\'+location.href;', 'Код для адреса закладки успешно скопирован в буфер обмена')">
                    <strong>javascript:location.href='https://omnireader.ru/?url='+location.href;</strong>
                </span>
                <br>Тогда, нажав на получившуюся кнопку на любой странице интернета, вы автоматически откроете ее в Omni Reader.
            </p>
        </div>
        <p>Связаться с разработчиком: <a href="mailto:bookpauk@gmail.com">bookpauk@gmail.com</a></p>
    </div>
</template>

<script>
//-----------------------------------------------------------------------------
import Vue from 'vue';
import Component from 'vue-class-component';

import {copyTextToClipboard} from '../../../../share/utils';

export default @Component({
})
class CommonHelpPage extends Vue {
    created() {
    }

    get mode() {
        return this.$store.state.config.mode;
    }

    async copyText(text, mes) {
        const result = await copyTextToClipboard(text);
        const msg = (result ? mes : 'Копирование не удалось');
        if (result)
            this.$notify.success({message: msg});
        else
            this.$notify.error({message: msg});
    }
}
//-----------------------------------------------------------------------------
</script>

<style scoped>
.page {
    flex: 1;
    padding: 15px;
    overflow-y: auto;
    font-size: 120%;
    line-height: 130%;
}

h4 {
    margin: 0;
}

.clickable {
    color: blue;
    text-decoration: underline;
    cursor: pointer;
}
</style>
