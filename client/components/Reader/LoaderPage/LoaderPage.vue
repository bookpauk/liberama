<template>
    <div class="main">
        <div class="part">
            
        </div>
        <div class="part">
            
        </div>
        <div class="part bottom">
            
        </div>
    </div>
</template>

<script>
//-----------------------------------------------------------------------------
import Vue from 'vue';
import Component from 'vue-class-component';

export default @Component({
})
class LoaderPage extends Vue {
    created() {
    }

}
//-----------------------------------------------------------------------------
//    justify-content: space-between;

</script>
<style scoped>
.main {
    flex: 1;
    display: flex;
    flex-direction: column;
}


.part {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}

.bottom {
    justify-content: flex-end;
}

</style>