<!---------------------------------------------->
<div class="q-mt-sm column items-center">
    <span>Настройки конвертирования применяются ко всем</span>
    <span>вновь открываемым или обновляемым файлам</span>
</div>
<div class="part-header">HTML, XML, TXT</div>

<div class="item row">
    <div class="label-6">Сайты</div>
    <div class="col row">
        <q-checkbox v-model="enableSitesFilter" @input="needTextReload" size="xs" label="Включить html-фильтр для сайтов">
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

<div class="item row">
    <div class="label-6">Текст</div>
    <div class="col row">
        <q-checkbox v-model="splitToPara" @input="needTextReload" size="xs" label="Попытаться разбить текст на параграфы">
            <q-tooltip :delay="1000" anchor="top middle" self="bottom middle" content-style="font-size: 80%">
                Опция принудительно включает эвристику разбиения текста на<br>
                параграфы в случае, если формат файла определен как html,<br>
                xml или txt. Возможна нечитабельная разметка текста.
            </q-tooltip>
        </q-checkbox>
    </div>
</div>

<div class="part-header">PDF</div>

<div class="part-header">DJVU</div>
