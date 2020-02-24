<!---------------------------------------------->
<div class="part-header">Подсказки, уведомления</div>

<div class="item row">
    <div class="label-6">Подсказка</div>
    <q-checkbox size="xs" v-model="showClickMapPage" label="Показывать области управления кликом" :disable="!clickControl" >
        <q-tooltip :delay="1000" anchor="top middle" self="bottom middle" content-style="font-size: 80%">
            Показывать или нет подсказку при каждой загрузке книги
        </q-tooltip>
    </q-checkbox>
</div>

<div class="item row">
    <div class="label-6">Подсказка</div>
    <q-checkbox size="xs" v-model="blinkCachedLoad" label="Предупреждать о загрузке из кэша">
        <q-tooltip :delay="1000" anchor="top middle" self="bottom middle" content-style="font-size: 80%">
            Мерцать сообщением в строке статуса и на кнопке<br>
            обновления при загрузке книги из кэша
        </q-tooltip>
    </q-checkbox>
</div>

<div class="item row">
    <div class="label-6">Уведомление</div>
    <q-checkbox size="xs" v-model="showServerStorageMessages" label="Показывать сообщения синхронизации">
        <q-tooltip :delay="1000" anchor="top middle" self="bottom middle" content-style="font-size: 80%">
            Показывать уведомления и ошибки от<br>
            синхронизатора данных с сервером
        </q-tooltip>
    </q-checkbox>
</div>

<div class="item row">
    <div class="label-6">Уведомление</div>
    <q-checkbox size="xs" v-model="showWhatsNewDialog">
        Показывать уведомление "Что нового"
        <q-tooltip :delay="1000" anchor="top middle" self="bottom middle" content-style="font-size: 80%">
            Показывать уведомления "Что нового"<br>
            при каждом выходе новой версии читалки
        </q-tooltip>
    </q-checkbox>
</div>

<div class="item row">
    <div class="label-6">Уведомление</div>
    <q-checkbox size="xs" v-model="showDonationDialog2020">
        Показывать "Оплатим хостинг вместе"
        <q-tooltip :delay="1000" anchor="top middle" self="bottom middle" content-style="font-size: 80%">
            Показывать уведомление "Оплатим хостинг вместе"
        </q-tooltip>
    </q-checkbox>
</div>

<!---------------------------------------------->
<div class="part-header">Другое</div>

<div class="item row">
    <div class="label-6">Парам. в URL</div>
    <q-checkbox size="xs" v-model="allowUrlParamBookPos">
        Добавлять параметр "__p"
        <q-tooltip :delay="1000" anchor="top middle" self="bottom middle" content-style="font-size: 80%">
            Добавление параметра "__p" в строке браузера<br>
            позволяет передавать ссылку на книгу в читалке<br>
            без потери текущей позиции. Однако в этом случае<br>
            при листании забивается история браузера, т.к. на<br>
            каждое изменение позиции происходит смена URL.
        </q-tooltip>
    </q-checkbox>
</div>

<div class="item row">
    <div class="label-6">Парсинг</div>
    <q-checkbox size="xs" v-model="lazyParseEnabled" label="Предварительная обработка текста">
        <q-tooltip :delay="1000" anchor="top middle" self="bottom middle" content-style="font-size: 80%">
            Включение этой опции позволяет делать предварительную<br>
            обработку текста в ленивом режиме сразу после загрузки<br>
            книги. Это может повысить отзывчивость читалки, но<br>
            нагружает процессор каждый раз при открытии книги.
        </q-tooltip>
    </q-checkbox>
</div>

<div class="item row">
    <div class="label-6">Копирование</div>
    <q-checkbox size="xs" v-model="copyFullText" label="Загружать весь текст">
        <q-tooltip :delay="1000" anchor="top middle" self="bottom middle" content-style="font-size: 80%">
            Загружать весь текст в окно<br>
            копирования текста со страницы
        </q-tooltip>
    </q-checkbox>
</div>
