<template>
    <div class="window">
        <div class="header">
            <span class="header-text"><slot name="header"></slot></span>
            <span class="close-button" @click="close"><i class="el-icon-close"></i></span>
        </div>
        <slot></slot>
    </div>
</template>

<script>
//-----------------------------------------------------------------------------
import Vue from 'vue';
import Component from 'vue-class-component';

export default @Component({
})
class Window extends Vue {
    close() {
        this.$emit('close');
    }

}
//-----------------------------------------------------------------------------
</script>

<style scoped>
.window {
    flex: 1;
    display: flex;
    flex-direction: column;
    background-color: #e5e7ea;
    margin: 10px;
    border: 1px solid black;
    box-shadow: 3px 3px 5px black;
}

.header {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    height: 40px;
}

.header-text {
    flex: 1;
    margin-left: 10px;
    margin-right: 10px;
}

.close-button {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 40px;
    height: 40px;
    cursor: pointer;
}
</style>