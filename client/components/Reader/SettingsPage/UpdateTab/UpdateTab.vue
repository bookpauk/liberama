<template>
    <div class="fit sets-tab-panel">
        <!---------------------------------------------->
        <div class="sets-part-header">
            Обновление читалки
        </div>
        <div class="sets-item row">
            <div class="sets-label label"></div>
            <q-checkbox v-model="form.showNeedUpdateNotify" size="xs">
                Проверять наличие новой версии
                <q-tooltip :delay="1000" anchor="top middle" self="bottom middle" content-style="font-size: 80%">
                    Напоминать о необходимости обновления страницы<br>
                    при появлении новой версии читалки
                </q-tooltip>
            </q-checkbox>
        </div>

        <!---------------------------------------------->
        <div class="sets-part-header">
            Обновление книг
        </div>
        <div v-show="!configBucEnabled" class="sets-item row">
            <div class="sets-label label"></div>
            <div>Сервер обновлений временно не работает</div>
        </div>

        <div v-show="configBucEnabled" class="sets-item row">
            <div class="sets-label label"></div>
            <q-checkbox v-model="form.bucEnabled" size="xs">
                Проверять обновления книг
            </q-checkbox>
        </div>

        <div v-show="configBucEnabled && form.bucEnabled" class="sets-item row">
            <div class="sets-label label"></div>
            <div class="col-4 column justify-center items-end q-pr-xs">
                Разница размеров
            </div>
            <div class="col row">
                <NumInput v-model="form.bucSizeDiff" bg-color="input" style="width: 200px" />

                <q-tooltip :delay="1000" anchor="top middle" self="bottom middle" content-style="font-size: 80%">
                    Уведомлять о наличии обновления книги в списке загруженных<br>
                    при указанной разнице в размерах старого и нового файлов.<br>
                    Разница указывается в байтах и может быть отрицательной.
                </q-tooltip>
            </div>
        </div>

        <div v-show="configBucEnabled && form.bucEnabled" class="sets-item row">
            <div class="sets-label label"></div>
            <q-checkbox v-model="form.bucSetOnNew" size="xs">
                Автопроверка для вновь загружаемых
                <q-tooltip :delay="1000" anchor="top middle" self="bottom middle" content-style="font-size: 80%">
                    Автоматически устанавливать флаг проверки<br>
                    обновлений для всех вновь загружаемых книг
                </q-tooltip>
            </q-checkbox>
        </div>

        <div v-show="configBucEnabled && form.bucEnabled" class="sets-item row">
            <div class="sets-label label"></div>
            <q-checkbox v-model="form.bucCancelEnabled" size="xs">
                Отменять проверку через {{ form.bucCancelDays }} дней{{ (form.bucCancelEnabled ? ':' : '') }}
                <q-tooltip :delay="1000" anchor="top middle" self="bottom middle" content-style="font-size: 80%">
                    Снимать флаг проверки с книги, если не было<br>
                    обновлений в течение {{ form.bucCancelDays }} дней
                </q-tooltip>
            </q-checkbox>
        </div>

        <div v-show="configBucEnabled && form.bucEnabled && form.bucCancelEnabled" class="sets-item row">
            <div class="sets-label label"></div>
            <div class="col-4"></div>
            <div class="col row">
                <NumInput v-model="form.bucCancelDays" bg-color="input" :min="1" :max="10000" />

                <q-tooltip :delay="1000" anchor="top middle" self="bottom middle" content-style="font-size: 80%">
                    Снимать флаг проверки с книги, если не было<br>
                    обновлений в течение {{ form.bucCancelDays }} дней
                </q-tooltip>
            </div>
        </div>
    </div>
</template>

<script>
//-----------------------------------------------------------------------------
import vueComponent from '../../../vueComponent.js';
import NumInput from '../../../share/NumInput.vue';

const componentOptions = {
    components: {
        NumInput
    },
};
class UpdateTab {
    _options = componentOptions;
    _props = {
        form: Object,
    };

    created() {
    }

    mounted() {
    }

    get configBucEnabled() {
        return this.$store.state.config.bucEnabled;
    }
}

export default vueComponent(UpdateTab);
//-----------------------------------------------------------------------------
</script>

<style scoped>
.label {
    width: 100px;
}
</style>
