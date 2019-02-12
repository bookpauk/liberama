<template>
    <div class="page">
        <div class="box">
            <p class="p">Проект существует исключительно на личном энтузиазме.</p>
            <p class="p">Чтобы энтузиазма было побольше, вы можете пожертвовать на развитие проекта любую сумму:</p>
            <div class="address">
                <img class="logo" src="./assets/yandex.png">
                <el-button class="button" @click="donateYandexMoney">Пожертвовать</el-button><br>
                <div class="para">{{ yandexAddress }}</div>
            </div>

            <div class="address">                
                <img class="logo" src="./assets/bitcoin.png">
                <el-button class="button" @click="copyAddress(bitcoinAddress, 'Bitcoin')">Скопировать</el-button><br>
                <div class="para">{{ bitcoinAddress }}</div>
            </div>

            <div class="address">                
                <img class="logo" src="./assets/litecoin.png">
                <el-button class="button" @click="copyAddress(litecoinAddress, 'Litecoin')">Скопировать</el-button><br>
                <div class="para">{{ litecoinAddress }}</div>
            </div>

            <div class="address">                
                <img class="logo" src="./assets/monero.png">
                <el-button class="button" @click="copyAddress(moneroAddress, 'Monero')">Скопировать</el-button><br>
                <div class="para">{{ moneroAddress }}</div>
            </div>
        </div>
    </div>
</template>

<script>
//-----------------------------------------------------------------------------
import Vue from 'vue';
import Component from 'vue-class-component';
import {copyTextToClipboard} from '../../../../share/utils';

export default @Component({
})
class DonateHelpPage extends Vue {
    yandexAddress = '410018702323056';
    bitcoinAddress = '3EbgZ7MK1UVaN38Gty5DCBtS4PknM4Ut85';
    litecoinAddress = 'MP39Riec4oSNB3XMjiquKoLWxbufRYNXxZ';
    moneroAddress = '8BQPnvHcPSHM5gMQsmuypDgx9NNsYqwXKfDDuswEyF2Q2ewQSfd2pkK6ydH2wmMyq2JViZvy9DQ35hLMx7g72mFWNJTPtnz';

    created() {
    }

    donateYandexMoney() {
        window.open(`https://money.yandex.ru/to/${this.yandexAddress}`, '_blank');
    }

    async copyAddress(address, prefix) {
        const result = await copyTextToClipboard(address);
        const msg = (result ? `${prefix}-адрес ${address} успешно скопирован в буфер обмена` : 'Копирование не удалось');
        if (result)
            this.$notify.success({message: msg});
        else
            this.$notify.error({message: msg});
    }
}
//-----------------------------------------------------------------------------
</script>

<style scoped>
.page {
    flex: 1;
    padding: 15px;
    overflow-y: auto;
    font-size: 120%;
    line-height: 130%;
    display: flex;
}

.p {
    margin: 0;
    padding: 0;
    text-indent: 20px;
}

.box {
    flex: 1;
    max-width: 550px;
    overflow-wrap: break-word;
}

h5 {
    margin: 0;
}

.address {
    padding-top: 10px;
    margin-top: 20px;
}

.para {
    margin: 10px 10px 10px 40px;
}

.button {
    margin-left: 10px;
}

.logo {
    width: 130px;
    position: relative;
    top: 10px;
}
</style>
