<template>
    <div class="page">
        <div class="box">
            <p class="p">Вы можете пожертвовать на развитие проекта любую сумму:</p>
            <div class="address">
                <img class="logo" src="./assets/yandex.png">
                <el-button class="button" @click="donateYandexMoney">Пожертвовать</el-button><br>
                <div class="para">{{ yandexAddress }}
                    <el-tooltip :open-delay="500" effect="light">
                        <template slot="content">
                            Скопировать
                        </template>
                        <i class="el-icon-copy-document copy-icon" @click="copyAddress(yandexAddress, 'Яндекс кошелек')"></i>
                    </el-tooltip>
                </div>
            </div>

            <div class="address">                
                <img class="logo" src="./assets/bitcoin.png">
                <div class="para">{{ bitcoinAddress }}
                    <el-tooltip :open-delay="500" effect="light">
                        <template slot="content">
                            Скопировать
                        </template>
                        <i class="el-icon-copy-document copy-icon" @click="copyAddress(bitcoinAddress, 'Bitcoin-адрес')"></i>
                    </el-tooltip>
                </div>
            </div>

            <div class="address">                
                <img class="logo" src="./assets/litecoin.png">
                <div class="para">{{ litecoinAddress }}
                    <el-tooltip :open-delay="500" effect="light">
                        <template slot="content">
                            Скопировать
                        </template>
                        <i class="el-icon-copy-document copy-icon" @click="copyAddress(litecoinAddress, 'Litecoin-адрес')"></i>
                    </el-tooltip>
                </div>
            </div>

            <div class="address">                
                <img class="logo" src="./assets/monero.png">
                <div class="para">{{ moneroAddress }}
                    <el-tooltip :open-delay="500" effect="light">
                        <template slot="content">
                            Скопировать
                        </template>
                        <i class="el-icon-copy-document copy-icon" @click="copyAddress(moneroAddress, 'Monero-адрес')"></i>
                    </el-tooltip>
                </div>
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
        if (result)
            this.$notify.success({message: `${prefix} ${address} успешно скопирован в буфер обмена`});
        else
            this.$notify.error({message: 'Копирование не удалось'});
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

.copy-icon {
    margin-left: 10px;
    cursor: pointer;
    font-size: 120%;
}
</style>
