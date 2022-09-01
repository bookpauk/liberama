<template>
    <div class="page">
        <div class="column items-center" style="width: 500px">
            <p class="p">
                Здесь вы можете пожертвовать на развитие проекта:
            </p>

            <q-btn no-caps class="q-my-lg" color="green-8" size="14px" style="width: 200px" @click="makeDonation">
                <q-icon class="q-mr-xs" name="la la-donate" size="24px" />
                Поддержать проект
            </q-btn>

            <div style="font-size: 60%">
                * Ваш донат является подарком автору проекта
            </div>
        </div>
    </div>
</template>

<script>
//-----------------------------------------------------------------------------
import vueComponent from '../../../vueComponent.js';

import * as utils from '../../../../share/utils';

class DonateHelpPage {
    created() {
    }

    makeDonation() {
        utils.makeDonation();
    }
}

export default vueComponent(DonateHelpPage);
//-----------------------------------------------------------------------------
</script>

<style scoped>
.page {
    padding: 15px;
    overflow-y: auto;
    font-size: 120%;
    line-height: 130%;
}

.p {
    margin: 0;
    padding: 0;
    text-indent: 20px;
}
</style>
