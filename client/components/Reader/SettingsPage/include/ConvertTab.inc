<!---------------------------------------------->
<div class="part-header">Конвертирование</div>

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

