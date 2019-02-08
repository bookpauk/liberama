<template>
    <div class="page">
        <h4>Управление с помощью мыши/тачпада:</h4>
        <ul>
            <li><b>ЛКМ/ТАЧ</b> по экрану в одну из областей - активация действия:</li>
                <div class="click-map-page">
                    <ClickMapPage ref="clickMapPage"></ClickMapPage>
                </div>
            <li><b>ПКМ</b> - показать/скрыть панель управления</li>
            <li><b>СКМ</b> - вкл./выкл. плавный скроллинг текста</li>
        </ul>
    </div>
</template>

<script>
//-----------------------------------------------------------------------------
import Vue from 'vue';
import Component from 'vue-class-component';

import ClickMapPage from '../../ClickMapPage/ClickMapPage.vue';

export default @Component({
    components: {
        ClickMapPage,
    },
})
class MouseHelpPage extends Vue {
    created() {
    }

    mounted() {
        this.$refs.clickMapPage.$el.style.fontSize = '50%';
        this.$refs.clickMapPage.$el.style.backgroundColor = '#478355';
    }
}
//-----------------------------------------------------------------------------
</script>

<style scoped>
.page {
    flex: 1;
    padding: 15px;
    overflow-y: auto;
    font-size: 150%;
    line-height: 130%;
}

h4 {
    margin: 0;
}

.click-map-page {
    position: relative;
    width: 400px;
    height: 400px;
    margin: 10px 0 10px 0;
}
</style>
