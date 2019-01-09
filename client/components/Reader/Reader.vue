<template>
    <el-container>
        <el-header height='50px'>
        <div class="header">
            <el-button plain class="tool-button" @click="doBack"><i class="el-icon-back"></i></el-button>

            <div>
                <el-button plain class="tool-button" @click="" ><i class="el-icon-arrow-left"></i></el-button>
                <el-button plain class="tool-button" @click="" ><i class="el-icon-arrow-right"></i></el-button>
                <div class="space"></div>
                <el-button plain class="tool-button" @click=""><i class="el-icon-rank"></i></el-button>
                <el-button plain class="tool-button" @click=""><i class="el-icon-d-arrow-right"></i></el-button>
                <el-button plain class="tool-button" @click=""><i class="el-icon-sort"></i></el-button>
                <el-button plain class="tool-button" @click=""><i class="el-icon-search"></i></el-button>
                <el-button plain class="tool-button" @click=""><i class="el-icon-refresh"></i></el-button>                
                <div class="space"></div>
                <el-button plain class="tool-button" @click=""><i class="el-icon-document"></i></el-button>
            </div>

            <el-button plain class="tool-button" @click=""><i class="el-icon-setting"></i></el-button>            
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
    created() {
    }

    doBack() {
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
    background-color: #E6EDF4;
    margin-top: 5px;
    height: 38px;
    width: 38px;
    border: 0;
}

i {
    font-size: 200%;
    color: #806142;
}

.space {
    width: 10px;
    display: inline-block;
}
</style>