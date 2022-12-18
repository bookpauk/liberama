<template>
    <div class="fit sets-tab-panel">
        <!---------------------------------------------->
        <div class="sets-part-header">
            Подсказки, уведомления
        </div>

        <div class="sets-item row no-wrap">
            <div class="sets-label label">
                Подсказка
            </div>
            <q-checkbox v-model="form.showClickMapPage" size="xs" label="Показывать области управления кликом" :disable="!form.clickControl">
                <q-tooltip :delay="1000" anchor="top middle" self="bottom middle" content-style="font-size: 80%">
                    Показывать или нет подсказку при каждой загрузке книги
                </q-tooltip>
            </q-checkbox>
        </div>

        <div class="sets-item row">
            <div class="sets-label label">
                Подсказка
            </div>
            <q-checkbox v-model="form.blinkCachedLoad" size="xs" label="Предупреждать о загрузке из кэша">
                <q-tooltip :delay="1000" anchor="top middle" self="bottom middle" content-style="font-size: 80%">
                    Мерцать сообщением в строке статуса и на кнопке<br>
                    обновления при загрузке книги из кэша
                </q-tooltip>
            </q-checkbox>
        </div>

        <div class="sets-item row no-wrap">
            <div class="sets-label label">
                Уведомление
            </div>
            <q-checkbox v-model="form.showServerStorageMessages" size="xs" label="Показывать сообщения синхронизации">
                <q-tooltip :delay="1000" anchor="top middle" self="bottom middle" content-style="font-size: 80%">
                    Показывать уведомления и ошибки от<br>
                    синхронизатора данных с сервером
                </q-tooltip>
            </q-checkbox>
        </div>

        <div class="sets-item row">
            <div class="sets-label label">
                Уведомление
            </div>
            <q-checkbox v-model="form.showWhatsNewDialog" size="xs">
                Показывать уведомление "Что нового"
                <q-tooltip :delay="1000" anchor="top middle" self="bottom middle" content-style="font-size: 80%">
                    Показывать уведомления "Что нового"<br>
                    при появлении новой версии читалки
                </q-tooltip>
            </q-checkbox>
        </div>

        <div class="sets-item row">
            <div class="sets-label label">
                Уведомление
            </div>
            <q-checkbox v-model="form.showDonationDialog" size="xs">
                Показывать форму доната
                <q-tooltip :delay="1000" anchor="top middle" self="bottom middle" content-style="font-size: 80%">
                    Показывать диалог для сбора пожертвований
                </q-tooltip>
            </q-checkbox>
        </div>

        <!---------------------------------------------->
        <div class="sets-part-header">
            Другое
        </div>

        <div class="sets-item row">
            <div class="sets-label label">
                Обработка
            </div>
            <q-checkbox v-model="form.lazyParseEnabled" size="xs" label="Предварительная подготовка текста">
                <q-tooltip :delay="1000" anchor="top middle" self="bottom middle" content-style="font-size: 80%">
                    Включение этой опции позволяет делать предварительную<br>
                    подготовку всего текста в ленивом режиме сразу после<br>
                    загрузки книги. Это может повысить отзывчивость читалки,<br>
                    но нагружает процессор каждый раз при открытии книги.
                </q-tooltip>
            </q-checkbox>
        </div>

        <div class="sets-item row">
            <div class="sets-label label">
                Парам. в URL
            </div>
            <q-checkbox v-model="form.allowUrlParamBookPos" size="xs">
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

        <div class="sets-item row">
            <div class="sets-label label">
                Копирование
            </div>
            <q-checkbox v-model="form.copyFullText" size="xs" label="Загружать весь текст">
                <q-tooltip :delay="1000" anchor="top middle" self="bottom middle" content-style="font-size: 80%">
                    Загружать весь текст в окно<br>
                    копирования текста со страницы
                </q-tooltip>
            </q-checkbox>
        </div>
    </div>
</template>

<script>
//-----------------------------------------------------------------------------
import vueComponent from '../../../vueComponent.js';

const componentOptions = {
    components: {
    },
};
class OthersTab {
    _options = componentOptions;
    _props = {
        form: Object,
    };

    created() {
    }

    mounted() {
    }

}

export default vueComponent(OthersTab);
//-----------------------------------------------------------------------------
</script>

<style scoped>
.label {
    width: 100px;
}

</style>
