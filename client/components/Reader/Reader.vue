<template>
    <el-container>
        <el-header height='50px'>
            <el-button plain class="tool-button" @click="doBack"><i class="el-icon-back"></i></el-button>
            <div class="space"></div>
            <el-button plain class="tool-button" @click="" ><i class="el-icon-arrow-left"></i></el-button>
            <el-button plain class="tool-button" @click="" ><i class="el-icon-arrow-right"></i></el-button>
            <div class="space"></div>
            <el-button plain class="tool-button" @click=""><i class="el-icon-rank"></i></el-button>


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
i {
    font-size: 240%;
}

.el-container {
    padding: 0;
    margin: 0;
    height: 100%;
}

.el-header {
    padding-left: 7px;
    background-color: #1B695F;
    color: #000;
}
  
.el-main {
    padding: 0;
    margin: 0;
    background-color: #EBE2C9;
    color: #000;
}

.tool-button {
    margin: 0;
    padding: 0;
    background-color: #E6EDF4;
    margin-top: 5px;
    height: 38px;
    width: 38px;
    border: 0;
}

.space {
    width: 10px;
    display: inline-block;
}
</style>