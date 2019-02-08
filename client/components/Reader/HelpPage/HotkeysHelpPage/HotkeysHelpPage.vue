<template>
    <div class="page">
        <h4>Управление с помощью горячих клавиш:</h4>
        <ul>
            <li><b>Escape</b> - показать/скрыть страницу загрузки</li>
            <li><b>Tab</b> - показать/скрыть панель управления</li>
            <li><b>PageUp, Left, Shift+Space, Backspace</b> - страницу назад</li>
            <li><b>PageDown, Right, Space</b> - страницу вперед</li>
            <li><b>Home</b> - в начало книги</li>
            <li><b>End</b> - в конец книги</li>
            <li><b>Up</b> - строчку назад</li>
            <li><b>Down</b> - строчку вперёд</li>
            <li><b>A, Shift+A</b> - изменить размер шрифта</li>
            <li><b>Enter, F, F11, ` (апостроф)</b> - вкл./выкл. полный экран</li>
            <li><b>Z</b> - вкл./выкл. плавный скроллинг текста</li>
            <li><b>Shift+Down/Shift+Up</b> - увеличить/уменьшить скорость скроллинга
            <li><b>P</b> - установить страницу</li>
            <li><b>Ctrl+F</b> - найти в тексте</li>            
            <li><b>Ctrl+C</b> - скопировать текст со страницы</li>            
            <li><b>R</b> - принудительно обновить книгу в обход кэша</li>
            <li><b>H</b> - открыть недавние</li>
            <li><b>S</b> - открыть окно настроек</li>
        </ul>
    </div>
</template>

<script>
//-----------------------------------------------------------------------------
import Vue from 'vue';
import Component from 'vue-class-component';

export default @Component({
})
class HotkeysHelpPage extends Vue {
    created() {
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
</style>
