<template>
    <el-container>
        <el-aside :width="asideWidth">
            <div class="app-name"><span v-html="appName"></span></div>
            <el-button class="el-button-collapse" @click="toggleCollapse" :icon="buttonCollapseIcon"></el-button>
            <el-menu class="el-menu-vertical" @select="handleSelect" :collapse="isCollapse">
              <el-menu-item index="cardindex">
                <i class="el-icon-search"></i>
                <span slot="title">Картотека</span>
              </el-menu-item>
              <el-menu-item index="reader">
                <i class="el-icon-tickets"></i>
                <span slot="title">Читалка</span>
              </el-menu-item>
              <el-menu-item index="forum" disabled>
                <i class="el-icon-message"></i>
                <span slot="title">Форум-чат</span>
              </el-menu-item>
              <el-menu-item index="newbooks">
                <i class="el-icon-upload"></i>
                <span slot="title">Поступления</span>
              </el-menu-item>
              <el-menu-item index="sources">
                <i class="el-icon-menu"></i>
                <span slot="title">Источники</span>
              </el-menu-item>
              <el-menu-item index="settings">
                <i class="el-icon-setting"></i>
                <span slot="title">Параметры</span>
              </el-menu-item>
              <el-menu-item index="help">
                <i class="el-icon-question"></i>
                <span slot="title">Справка</span>
              </el-menu-item>
            </el-menu>
        </el-aside>

        <el-main>
            <pre>{{ apiError }}</pre>
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
    created() {
        this.commit = this.$store.commit;
        this.dispatch = this.$store.dispatch;
        this.state = this.$store.state;
        this.uistate = this.$store.state.uistate;
        this.config = this.$store.state.config;
    }

    mounted() {
        this.dispatch('config/loadConfig');
        this.$watch('apiError', function(newError, oldError) {
            if (newError) {
                this.$notify.error({
                    title: 'Error',
                    dangerouslyUseHTMLString: true,
                    message: newError.response.config.url + '<br>' + newError.response.statusText
                });
            }
        });
    }

    handleSelect(key, keyPath) {
        console.log(key, keyPath);
    }

    toggleCollapse() {
        this.commit('uistate/setAsideBarCollapse', !this.uistate.asideBarCollapse);
    }

    get isCollapse() {
        return this.uistate.asideBarCollapse;
    }

    get asideWidth() {
        if (this.uistate.asideBarCollapse) {
            return '64px';
        } else {
            return '160px';
        }
    }

    get buttonCollapseIcon() {
        if (this.uistate.asideBarCollapse) {
            return 'el-icon-d-arrow-right';
        } else {
            return 'el-icon-d-arrow-left';
        }
    }

    get appName() {
        if (this.isCollapse)
            return '<br><br>';
        else
            return `${this.config.name} <br>v${this.config.version}`;
    }

    get apiError() {
        return this.state.apiError;
    }
}
</script>

<style scoped>
.app-name {
    margin-left: 10px;
    margin-top: 10px;
    text-align: center;
    line-height: 140%;
    font-weight: bold;
}
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
.el-menu-item {
    font-size: 80%;
}
</style>

<style>
body, html, #app {
    margin: 0;
    padding: 0;
    height: 100%;
    font: normal 12pt Arial, Verdana, Sans-serif;
}
</style>
