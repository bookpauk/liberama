<template>
    <div class="page">
        <div class="box">
            <div>
                Здесь вы можете пожертвовать на развитие проекта:
            </div>

            <div class="row items-center address no-wrap">
                <img class="logo" src="./assets/donate.svg">
                <div class="para">
                    <q-btn color="green-8" size="14px" style="width: 200px" dense no-caps @click="donateFiat">
                        <q-icon class="q-mr-xs" name="la la-donate" size="24px" />
                        Поддержать проект
                    </q-btn>
                </div>
                <span class="q-ml-xs text-grey-8">(банковские карты, СБП)</span>
            </div>

            <div class="row items-center address no-wrap">
                <img class="logo" src="./assets/bitcoin.svg">
                <div class="para">
                    <q-btn color="orange-8" size="14px" style="width: 200px" dense no-caps @click="donateCrypto">
                        <q-icon class="q-mr-xs" name="la la-coins" size="24px" />
                        Пожертвовать
                    </q-btn>
                </div>
                <span class="q-ml-xs text-grey-8">(криптовалюты)</span>
            </div>

            <div class="q-mt-md">
                Или перевести напрямую автору:
            </div>

            <div class="row items-center address no-wrap">
                <img class="logo" src="./assets/iomoney.svg">
                <div class="para">
                    <q-btn color="deep-purple-13" size="14px" style="width: 200px" dense no-caps @click="donateYooMoney">
                        Перевести
                    </q-btn>
                </div>
            </div>

            <div class="q-mt-md" style="font-size: 60%">
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

    get donation() {
        return this.$store.state.config.donation;
    }

    get donationAddress() {
        return this.donation || [];
    }

    donateFiat() {
        window.open(this.donationAddress['donate'], '_blank');
    }

    donateCrypto() {
        window.open(this.donationAddress['crypto'], '_blank');
    }

    donateYooMoney() {
        window.open(`https://yoomoney.ru/to/${this.donationAddress['yoomoney']}`, '_blank');
    }

    async copyAddress(address, prefix) {
        const result = await utils.copyTextToClipboard(address);
        if (result)
            this.$root.notify.success(`${prefix} ${address} успешно скопирован в буфер обмена`);
        else
            this.$root.notify.error('Копирование не удалось');
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
    line-height: 110%;
}

.box {
    max-width: 600px;
    overflow-wrap: break-word;
}

.address {
    margin-left: 20px;
    margin-top: 10px;
}

.para {
    margin: 5px 0px 5px 20px;
}

.logo {
    width: 130px;
}

.copy-icon {
    margin-left: 10px;
    cursor: pointer;
    font-size: 120%;
    color: blue;
}
</style>
