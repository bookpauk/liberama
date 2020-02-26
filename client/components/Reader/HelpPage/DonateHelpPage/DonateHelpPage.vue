<template>
    <div class="page">
        <div class="box">
            <p class="p">Вы можете пожертвовать на развитие проекта любую сумму:</p>
            <div class="address">
                <img class="logo" src="./assets/yandex.png">
                <q-btn class="q-ml-sm q-px-sm" dense no-caps @click="donateYandexMoney">Пожертвовать</q-btn><br>
                <div class="para">{{ yandexAddress }}
                    <q-icon class="copy-icon" name="la la-copy" @click="copyAddress(yandexAddress, 'Яндекс кошелек')">
                        <q-tooltip :delay="1000" anchor="top middle" self="center middle" content-style="font-size: 80%">Скопировать</q-tooltip>                    
                    </q-icon>
                </div>
            </div>

            <div class="address">                
                <img class="logo" src="./assets/paypal.png">
                <div class="para">{{ paypalAddress }}
                    <q-icon class="copy-icon" name="la la-copy" @click="copyAddress(paypalAddress, 'Paypal-адрес')">
                        <q-tooltip :delay="1000" anchor="top middle" self="center middle" content-style="font-size: 80%">Скопировать</q-tooltip>                    
                    </q-icon>
                </div>
            </div>

            <div class="address">                
                <img class="logo" src="./assets/bitcoin.png">
                <div class="para">{{ bitcoinAddress }}
                    <q-icon class="copy-icon" name="la la-copy" @click="copyAddress(bitcoinAddress, 'Bitcoin-адрес')">
                        <q-tooltip :delay="1000" anchor="top middle" self="center middle" content-style="font-size: 80%">Скопировать</q-tooltip>                    
                    </q-icon>
                </div>
            </div>

            <div class="address">                
                <img class="logo" src="./assets/litecoin.png">
                <div class="para">{{ litecoinAddress }}
                    <q-icon class="copy-icon" name="la la-copy" @click="copyAddress(litecoinAddress, 'Litecoin-адрес')">
                        <q-tooltip :delay="1000" anchor="top middle" self="center middle" content-style="font-size: 80%">Скопировать</q-tooltip>                    
                    </q-icon>
                </div>
            </div>

            <div class="address">                
                <img class="logo" src="./assets/monero.png">
                <div class="para">{{ moneroAddress }}
                    <q-icon class="copy-icon" name="la la-copy" @click="copyAddress(moneroAddress, 'Monero-адрес')">
                        <q-tooltip :delay="1000" anchor="top middle" self="center middle" content-style="font-size: 80%">Скопировать</q-tooltip>                    
                    </q-icon>
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
    paypalAddress = 'bookpauk@gmail.com';
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
            this.$root.notify.success(`${prefix} ${address} успешно скопирован в буфер обмена`);
        else
            this.$root.notify.error('Копирование не удалось');
    }
}
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

.box {
    max-width: 550px;
    overflow-wrap: break-word;
}

.address {
    padding-top: 10px;
    margin-top: 20px;
}

.para {
    margin: 10px 10px 10px 40px;
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
    color: blue;
}
</style>
