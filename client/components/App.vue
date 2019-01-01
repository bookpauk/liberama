<template>
    <el-container>
        <el-aside :width="asideWidth">
            <el-button class="el-button-collapse" @click="toggleCollapse" :icon="buttonCollapseIcon"></el-button>
            <el-menu default-active="1" class="el-menu-vertical" @select="handleSelect" :collapse="isCollapse">
              <el-menu-item index="1">
                <i class="el-icon-search"></i>
                <span slot="title">Картотека</span>
              </el-menu-item>
              <el-menu-item index="2">
                <i class="el-icon-menu"></i>
                <span slot="title">Источники</span>
              </el-menu-item>
              <el-menu-item index="3" disabled>
                <i class="el-icon-message"></i>
                <span slot="title">Форум</span>
              </el-menu-item>
              <el-menu-item index="4">
                <i class="el-icon-setting"></i>
                <span slot="title">Параметры</span>
              </el-menu-item>
              <el-menu-item index="5">
                <i class="el-icon-question"></i>
                <span slot="title">Справка</span>
              </el-menu-item>
            </el-menu>
        </el-aside>

        <el-main>
            Main
        </el-main>
    </el-container>
</template>

<script>
import Vue from 'vue';
import Component from 'vue-class-component';

export default @Component({
    props: {
        test: String
    },
})
class App extends Vue {
    isCollapse = false;
    asideWidth = '170px';
    buttonCollapseIcon = 'el-icon-d-arrow-left';

    handleSelect(key, keyPath) {
        console.log(key, keyPath);
    }

    toggleCollapse() {
        this.isCollapse = !this.isCollapse;
        if (this.isCollapse) {
            this.asideWidth = '64px';
            this.buttonCollapseIcon = 'el-icon-d-arrow-right';
        }
        else {
            this.asideWidth = '170px';
            this.buttonCollapseIcon = 'el-icon-d-arrow-left';
        }
    }
}
</script>

<style scoped>
.el-container {
    height: 100%;
}

.el-aside {
    line-height: 1;
    background-color: #ddd;
    color: #000;
}
  
.el-main {
    background-color: #E9EEF3;
    color: #333;
}

.el-menu-vertical:not(.el-menu--collapse) {
    background-color: inherit;
    color: inherit;
    text-align: left;
    width: 100%;
    border: 0;
}

.el-menu--collapse {
    background-color: inherit;
    color: inherit;
    border: 0;
}

.el-button-collapse, .el-button-collapse:focus, .el-button-collapse:active, .el-button-collapse:hover {
    background-color: inherit;
    color: inherit;
    margin-top: 5px;
    width: 100%;
    border: 0;
 }

</style>

<style>
body, html, #app {
    margin: 0;
    padding: 0;
    height: 100%;
}
</style>
