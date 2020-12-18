<!---------------------------------------------->
<div class="q-mt-sm column items-center">
    <span>Настройки конвертирования применяются ко всем</span>
    <span>вновь загружаемым или обновляемым файлам</span>
</div>

<!---------------------------------------------->
<div class="part-header">HTML, XML, TXT</div>

<div class="item row">
    <div class="label-7">Текст</div>
    <div class="col row">
        <q-checkbox v-model="splitToPara" size="xs" label="Попытаться разбить текст на параграфы">
            <q-tooltip :delay="1000" anchor="top middle" self="bottom middle" content-style="font-size: 80%">
                Опция принудительно включает эвристику разбиения текста на<br>
                параграфы в случае, если формат файла определен как html,<br>
                xml или txt. Возможна нечитабельная разметка текста.
            </q-tooltip>
        </q-checkbox>
    </div>
</div>

<div class="item row">
    <div class="label-7">Сайты</div>
    <div class="col row">
        <q-checkbox v-model="enableSitesFilter" size="xs" label="Включить html-фильтр для сайтов">
            <q-tooltip :delay="1000" anchor="top middle" self="bottom middle" content-style="font-size: 80%">
                Html-фильтр вырезает лишние элементы со<br>
                страницы для определенных сайтов, таких как:<br>
                samlib.ru<br>
                www.fanfiction.net<br>
                archiveofourown.org<br>
                и других
            </q-tooltip>
        </q-checkbox>
    </div>
</div>

<!---------------------------------------------->
<div v-if="isExternalConverter">
    <div class="part-header">PDF</div>

    <div class="item row">
        <div class="label-7">Формат</div>
        <div class="col row">
            <q-checkbox v-model="pdfAsText" size="xs" label="Извлекать текст из PDF">
                <q-tooltip :delay="1000" anchor="top middle" self="bottom middle" content-style="font-size: 80%">
                    Пытается извлечь текст из pdf-файла и переразбить на параграфы.<br>
                    Размер получаемого fb2-файла при этом относительно небольшой.<br>
                    При отключении этой опции, pdf будет представлен как набор<br>
                    изображений (аналогично ковертированию djvu).
                </q-tooltip>
            </q-checkbox>
        </div>
    </div>

    <div class="item row">
        <div class="label-7">Качество</div>
        <div class="col row">
            <NumInput class="col-5" v-model="pdfQuality" :min="10" :max="100" :disable="pdfAsText" >
                <q-tooltip :delay="1000" anchor="top middle" self="bottom middle" content-style="font-size: 80%">
                    Качество конвертирования Pdf в Fb2. Чем значение выше, тем больше<br>
                    размер итогового файла. Если сервер отказывается конвертировать<br>
                    слишком большой файл, то попробуйте понизить качество.
                </q-tooltip>
            </NumInput>
        </div>
    </div>
</div>

<!---------------------------------------------->
<div v-if="isExternalConverter">
    <div class="part-header">DJVU</div>

    <div class="item row">
        <div class="label-7">Качество</div>
        <div class="col row">
            <NumInput class="col-5" v-model="djvuQuality" :min="10" :max="100">
                <q-tooltip :delay="1000" anchor="top middle" self="bottom middle" content-style="font-size: 80%">
                    Качество конвертирования Djvu в Fb2. Чем значение выше, тем больше<br>
                    размер итогового файла. Если сервер отказывается конвертировать<br>
                    слишком большой файл, то попробуйте понизить качество.
                </q-tooltip>
            </NumInput>
        </div>
    </div>
</div>
