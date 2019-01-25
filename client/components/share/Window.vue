<template>
    <div class="window">
        <div class="header">
            <span class="header-text"><slot name="header"></slot></span>
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
    created() {
    }

}
//-----------------------------------------------------------------------------
</script>

<style scoped>
.window {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 200px;
    max-width: 600px;
    background-color: #f5f7fa;
    margin: 10px;
    border: 1px solid black;
    box-shadow: 3px 3px 5px black;
}

.header {
    display: flex;
    align-items: center;
    height: 40px;
}

.header-text {
    margin-left: 10px;
}
</style>