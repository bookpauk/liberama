<!---------------------------------------------->
<div class="part-header">Обновление читалки</div>
<div class="item row">
    <div class="label-6"></div>
    <q-checkbox size="xs" v-model="showNeedUpdateNotify">
        Проверять наличие новой версии
        <q-tooltip :delay="1000" anchor="top middle" self="bottom middle" content-style="font-size: 80%">
            Напоминать о необходимости обновления страницы<br>
            при появлении новой версии читалки
        </q-tooltip>
    </q-checkbox>
</div>

<!---------------------------------------------->
<div class="part-header">Обновление книг</div>
<div class="item row">
    <div class="label-6"></div>
    <q-checkbox size="xs" v-model="bucEnabled">
        Проверять обновления книг
    </q-checkbox>
</div>

<div class="item row">
    <div class="label-6"></div>
    <q-checkbox size="xs" v-model="bucSetOnNew">
        Автопроверка для вновь загружаемых
        <q-tooltip :delay="1000" anchor="top middle" self="bottom middle" content-style="font-size: 80%">
            Автоматически устанавливать флаг проверки<br>
            обновлений для всех вновь загружаемых книг
        </q-tooltip>
    </q-checkbox>
</div>

<div v-show="bucEnabled" class="item row">
    <div class="label-6">Разница размеров</div>
    <div class="col row">
        <NumInput class="col-left" v-model="bucSizeDiff" />

        <q-tooltip :delay="1000" anchor="top middle" self="bottom middle" content-style="font-size: 80%">
            Уведомлять о наличии обновления книги в списке загруженных<br>
            при указанной разнице в размерах старого и нового файлов
        </q-tooltip>
    </div>
</div>

