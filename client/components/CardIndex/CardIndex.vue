<template>
    <el-container direction="vertical">
        <el-tabs type="border-card" style="height: 100%;" v-model="selectedTab">
            <el-tab-pane label="Поиск">
                <Search></Search>
            </el-tab-pane>
            <el-tab-pane label="Автор">
                <Card></Card>
            </el-tab-pane>
            <el-tab-pane label="Книга">
                <Book></Book>
            </el-tab-pane>
            <el-tab-pane label="История">
                <History></History>
            </el-tab-pane>
            {{ this.$route.path }}
        </el-tabs>
    </el-container>
</template>

<script>
//-----------------------------------------------------------------------------
import Vue from 'vue';
import Component from 'vue-class-component';
import Search from './Search/Search.vue';
import Card from './Card/Card.vue';
import Book from './Book/Book.vue';
import History from './History/History.vue';

export default @Component({
    components: {
        Search, Card, Book, History
    },
    watch: {
        selectedTab: function(newValue, oldValue) {
            switch (newValue) {
                case '0': this.$router.push('/cardindex/search'); break;
                case '1': this.$router.push('/cardindex/card'); break;
                case '2': this.$router.push('/cardindex/book'); break;
                case '3': this.$router.push('/cardindex/history'); break;
            }
        },        
    },
})
class CardIndex extends Vue {
    selectedTab = null;

    created() {
    }

}
//-----------------------------------------------------------------------------
</script>

<style scoped>
</style>