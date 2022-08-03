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
<div v-show="!configBucEnabled" class="item row">
    <div class="label-6"></div>
    <div>Сервер обновлений временно не работает</div>
</div>

<div v-show="configBucEnabled" class="item row">
    <div class="label-6"></div>
    <q-checkbox size="xs" v-model="bucEnabled">
        Проверять обновления книг
    </q-checkbox>
</div>

<div v-show="configBucEnabled && bucEnabled" class="item row">
    <div class="label-6"></div>
    <div class="col-5 column justify-center items-end q-pr-xs">Разница размеров</div>
    <div class="col row">
        <NumInput class="col-left" v-model="bucSizeDiff" />

        <q-tooltip :delay="1000" anchor="top middle" self="bottom middle" content-style="font-size: 80%">
            Уведомлять о наличии обновления книги в списке загруженных<br>
            при указанной разнице в размерах старого и нового файлов.<br>
            Разница указывается в байтах и может быть отрицательной.
        </q-tooltip>
    </div>
</div>

<div v-show="configBucEnabled && bucEnabled" class="item row">
    <div class="label-6"></div>
    <q-checkbox size="xs" v-model="bucSetOnNew">
        Автопроверка для вновь загружаемых
        <q-tooltip :delay="1000" anchor="top middle" self="bottom middle" content-style="font-size: 80%">
            Автоматически устанавливать флаг проверки<br>
            обновлений для всех вновь загружаемых книг
        </q-tooltip>
    </q-checkbox>
</div>

<div v-show="configBucEnabled && bucEnabled" class="item row">
    <div class="label-6"></div>
    <q-checkbox size="xs" v-model="bucCancelEnabled">
        Отменять проверку через {{ bucCancelDays }} дней{{ (bucCancelEnabled ? ':' : '') }}
        <q-tooltip :delay="1000" anchor="top middle" self="bottom middle" content-style="font-size: 80%">
            Снимать флаг проверки с книги, если не было<br>
            обновлений в течение {{ bucCancelDays }} дней
        </q-tooltip>
    </q-checkbox>
</div>

<div v-show="configBucEnabled && bucEnabled && bucCancelEnabled" class="item row">
    <div class="label-6"></div>
    <div class="col-5"></div>
    <div class="col row">
        <NumInput class="col-left" v-model="bucCancelDays" :min="1" :max="10000"/>

        <q-tooltip :delay="1000" anchor="top middle" self="bottom middle" content-style="font-size: 80%">
            Снимать флаг проверки с книги, если не было<br>
            обновлений в течение {{ bucCancelDays }} дней
        </q-tooltip>
    </div>
</div>

