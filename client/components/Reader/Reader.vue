<template>
    <el-container>
        <el-header height='50px'>
        <div class="header">
            <el-tooltip content="Загрузить книгу" open-delay="1000" effect="light">
                <el-button class="tool-button" :class="buttonActiveClass('back')" @click="doBack"><i class="el-icon-back"></i></el-button>
            </el-tooltip>

            <div>
                <el-tooltip content="Действие назад" open-delay="1000" effect="light">
                    <el-button class="tool-button" @click="" ><i class="el-icon-arrow-left"></i></el-button>
                </el-tooltip>
                <el-tooltip content="Действие вперед" open-delay="1000" effect="light">
                    <el-button class="tool-button" @click="" ><i class="el-icon-arrow-right"></i></el-button>
                </el-tooltip>
                <div class="space"></div>
                <el-tooltip content="На весь экран" open-delay="1000" effect="light">
                    <el-button class="tool-button" @click=""><i class="el-icon-rank"></i></el-button>
                </el-tooltip>
                <el-tooltip content="Прокрутка книги" open-delay="1000" effect="light">
                    <el-button class="tool-button" @click=""><i class="el-icon-d-arrow-right"></i></el-button>
                </el-tooltip>
                <el-tooltip content="Плавный скроллинг" open-delay="1000" effect="light">
                    <el-button class="tool-button" @click=""><i class="el-icon-sort"></i></el-button>
                </el-tooltip>
                <el-tooltip content="Найти в тексте" open-delay="1000" effect="light">
                    <el-button class="tool-button" @click=""><i class="el-icon-search"></i></el-button>
                </el-tooltip>
                <el-tooltip content="Принудительно обновить книгу в обход кеша" open-delay="1000" effect="light">
                    <el-button class="tool-button" @click=""><i class="el-icon-refresh"></i></el-button>                
                </el-tooltip>
                <div class="space"></div>
                <el-tooltip content="История" open-delay="1000" effect="light">
                    <el-button class="tool-button" @click=""><i class="el-icon-document"></i></el-button>
                </el-tooltip>
            </div>

            <el-tooltip content="Настроить" open-delay="1000" effect="light">
                <el-button class="tool-button" @click=""><i class="el-icon-setting"></i></el-button>            
            </el-tooltip>
        </div>
        </el-header>

        <el-main>
        </el-main>
    </el-container>
</template>

<script>
//-----------------------------------------------------------------------------
import Vue from 'vue';
import Component from 'vue-class-component';

export default @Component({
})
class Reader extends Vue {
    activeBack = false;
    created() {
    }

    doBack() {
        this.activeBack = !this.activeBack;
    }

    buttonActiveClass(button) {
        const activeClass = { 'tool-button-active': true, 'tool-button-active:hover': true };
        switch (button) {
            case 'back': return (this.activeBack ? activeClass : {}); break;
        }
        return {};
    }
}
//-----------------------------------------------------------------------------
//, .tool-button:focus, .tool-button:active, .tool-button:hover
</script>

<style scoped>
.el-container {
    padding: 0;
    margin: 0;
    height: 100%;
}

.el-header {
    padding-left: 5px;
    padding-right: 5px;
    background-color: #1B695F;
    color: #000;
    overflow-x: auto;
    overflow-y: hidden;
}
  
.header {
    display: flex;
    justify-content: space-between;
    min-width: 500px;
}

.el-main {
    padding: 0;
    margin: 0;
    background-color: #EBE2C9;
    color: #000;
}

.tool-button {
    margin: 0;
    margin-left: 2px;
    margin-right: 2px;
    padding: 0;
    color: #3E843E;
    background-color: #E6EDF4;
    margin-top: 5px;
    height: 38px;
    width: 38px;
    border: 0;
    box-shadow: 3px 3px 5px black;
}

.tool-button:hover {
    background-color: white;
}

.tool-button-active {
    box-shadow: 0 0 0;
    color: white;
    background-color: #8AB45F;
}

.tool-button-active:hover {
    color: white;
    background-color: #81C581;
}

i {
    font-size: 200%;
}

.space {
    width: 10px;
    display: inline-block;
}
</style>