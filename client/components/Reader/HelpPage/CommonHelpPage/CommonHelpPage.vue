<template>
    <div class="page">
        <span class="text-h5">Возможности читалки:</span>
        <ul>
            <li>загрузка любой страницы интернета</li>
            <li>синхронизация данных (настроек и читаемых книг) между различными устройствами</li>
            <li>работа в автономном режиме (без связи)</li>
            <li>изменение цвета фона, текста, размер и тип шрифта и прочее</li>
            <li>установка и запоминание текущей позиции и настроек в браузере и на сервере</li>
            <li>кэширование файлов книг на клиенте и на сервере</li>
            <li>открытие книг с локального диска</li>
            <li>плавный скроллинг текста</li>
            <li>анимация перелистывания</li>
            <li>поиск по тексту и копирование фрагмента</li>
            <li>запоминание недавних книг, скачивание книги из читалки в формате fb2</li>
            <li>управление кликом и с клавиатуры</li>
            <li>регистрация не требуется</li>
            <li>поддерживаемые браузеры: Google Chrome, Mozilla Firefox последних версий</li>
        </ul>

        <p>В качестве URL книги можно задавать html-страничку с книгой, либо прямую ссылку 
        на файл из онлайн-библиотеки (например, скопировав адрес ссылки или кнопки "скачать fb2").</p>
        <p>Поддерживаемые форматы: <b>fb2, fb2.zip, html, txt</b> и другие.</p>

        <div v-show="mode == 'omnireader'">
            <p>Вы можете добавить в свой браузер закладку, указав в ее свойствах вместо адреса следующий код:
                <br><strong>javascript:location.href='https://omnireader.ru/?url='+location.href;</strong>
                <q-icon class="copy-icon" name="la la-copy" @click="copyText('javascript:location.href=\'https://omnireader.ru/?url=\'+location.href;', 'Код для адреса закладки успешно скопирован в буфер обмена')">
                    <q-tooltip :delay="1000" anchor="top middle" self="center middle" content-style="font-size: 80%">Скопировать</q-tooltip>                    
                </q-icon>

                <br>или перетащив на панель закладок следующую ссылку:
                <br><a style="margin-left: 50px" href="javascript:location.href='https://omnireader.ru/?url='+location.href;">Omni Reader</a>
                <br>Тогда, активировав получившуюся закладку на любой странице интернета, вы автоматически загрузите эту страницу в Omni Reader.
                <br>В Chrome для Android можно вызывать такую закладку по имени прямо в адресной строке браузера (имя стоит сделать попроще).
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
import * as notify from '../../../share/notify';

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
            notify.success(this, msg);
        else
            notify.error(this, msg);
    }
}
//-----------------------------------------------------------------------------
</script>

<style scoped>
.page {
    padding: 15px;
    overflow-y: auto;
    font-size: 120%;
    line-height: 130%;
}

.copy-icon {
    margin-left: 10px;
    cursor: pointer;
    font-size: 120%;
    color: blue;
}
</style>
