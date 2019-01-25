<template>
    <div ref="main" class="main">
        <div class="window">
            <div class="header">
                <span class="header-text">Прочитаные книги:</span>
            </div>
            <div class="list">
                Test
            </div>
        </div>
    </div>
</template>

<script>
//-----------------------------------------------------------------------------
import Vue from 'vue';
import Component from 'vue-class-component';

export default @Component({
})
class HistoryPage extends Vue {
    created() {
        this.commit = this.$store.commit;
    }

}
//-----------------------------------------------------------------------------
</script>

<style scoped>
.main {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
}

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

.list {
    flex: 1;
    background-color: #ffffff;
}

.list-item {
}
</style>