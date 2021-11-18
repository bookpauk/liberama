<template>
    <div class="page">
        <span class="text-h6 text-bold">Управление с помощью мыши/тачскрина:</span>
        <ul>
            <li><b>ЛКМ/ТАЧ</b> по экрану в одну из областей - активация действия:</li>
            <div class="click-map-page">
                <ClickMapPage ref="clickMapPage"></ClickMapPage>
            </div>
        
            <li><b>ПКМ</b> - показать/скрыть панель управления</li>
            <li><b>СКМ</b> - вкл./выкл. плавный скроллинг текста</li>
            <br>
            <li>Жесты для тачскрина:</li>
            <ul>
                <li style="list-style-type: square">
                    от центра вверх: на весь экран
                </li>
                <li style="list-style-type: square">
                    от центра вниз: плавный скроллинг
                </li>
                <li style="list-style-type: square">
                    от центра вправо: увеличить скорость скроллинга
                </li>
                <li style="list-style-type: square">
                    от центра влево: уменьшить скорость скроллинга
                </li>
            </ul>
        </ul>
        * Для управления с помощью мыши/тачскрина необходимо установить галочку "Включить управление кликом" в настройках
    </div>
</template>

<script>
//-----------------------------------------------------------------------------
import vueComponent from '../../../vueComponent.js';

import ClickMapPage from '../../ClickMapPage/ClickMapPage.vue';

const componentOptions = {
    components: {
        ClickMapPage,
    },
};
class MouseHelpPage {
    _options = componentOptions;

    created() {
    }

    mounted() {
        this.$refs.clickMapPage.$el.style.fontSize = '50%';
        this.$refs.clickMapPage.$el.style.backgroundColor = '#478355';
    }
}

export default vueComponent(MouseHelpPage);
//-----------------------------------------------------------------------------
</script>

<style scoped>
.page {
    padding: 15px;
    overflow-y: auto;
    font-size: 120%;
    line-height: 130%;
}

.click-map-page {
    position: relative;
    width: 400px;
    height: 400px;
    margin: 10px 0 10px 0;
}
</style>
