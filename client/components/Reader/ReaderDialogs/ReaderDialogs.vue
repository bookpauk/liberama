<template>
    <div>
        <Dialog ref="dialog1" v-model="whatsNewVisible">
            <template #header>
                Что нового:
            </template>

            <div style="line-height: 20px; min-width: 300px">
                <div v-html="whatsNewContent"></div>
            </div>

            <span class="clickable" style="font-size: 13px" @click="openVersionHistory">Посмотреть историю версий</span>

            <template #footer>
                <q-btn class="q-px-md" dense no-caps @click="whatsNewDisable">
                    Больше не показывать
                </q-btn>
            </template>
        </Dialog>

        <q-dialog ref="dialog2" v-model="donationVisible" style="z-index: 100" no-route-dismiss no-esc-dismiss no-backdrop-dismiss>
            <div class="column bg-white no-wrap q-pa-md">
                <div class="row justify-center q-mb-md" style="font-size: 110%">
                    Здравствуйте, дорогие читатели!
                </div>

                <div class="q-mx-md column" style="word-break: normal">
                    <div>
                        Вот уже много лет мы все вместе пользуемся нашей любимой читалкой.<br><br>

                        Напоминаем вам, что проект является некоммерческим и обладает такими
                        достоинствами, как:

                        <ul>
                            <li>все функции читалки открыты и доступны совершенно бесплатно</li>
                            <li>в проекте отсутствует какая-либо реклама или баннеры</li>
                            <li>нет никакой регистрации и монетизации</li>
                            <li>нет сбора персональных данных</li>
                            <li>открытый исходный код</li>
                            <li>проект постепенно улучшается, по мере возможности</li>
                        </ul>

                        Однако на оплату хостинга читалки и сервера обновлений автор тратит свои 
                        собственные средства, а также тратит свое время и силы на улучшение проекта.
                        <br><br>
                        Поддержим же материально наш ресурс, чтобы и дальше спокойно существовать и развиваться:
                    </div>

                    <q-btn style="margin: 10px 50px 10px 50px" color="green-8" size="14px" no-caps @click="makeDonation">
                        <q-icon class="q-mr-xs" name="la la-donate" size="24px" />
                        Поддержать проект
                    </q-btn>

                    <q-btn style="margin: 0 50px 20px 50px" size="14px" no-caps @click="donationDialogRemind">
                        Напомнить в следующем месяце
                    </q-btn>

                    <div class="row justify-center">
                        <div class="q-px-sm clickable" style="font-size: 80%" @click="openDonate">
                            Помочь проекту можно в любое время
                        </div>
                    </div>
                </div>
            </div>
        </q-dialog>

        <Dialog ref="dialog3" v-model="urlHelpVisible">
            <template #header>
                Обнаружена невалидная ссылка в поле "URL книги".
                <br>
            </template>

            <div style="word-break: normal">
                Если вы хотите найти определенную книгу и открыть в читалке, добро пожаловать в
                раздел "Сетевая библиотека" (кнопка <q-icon name="la la-sitemap" size="32px" />) на сайте
                <a href="https://liberama.top" target="_blank">liberama.top</a>

                <br><br>
                Если же вы пытаетесь вставить текст в читалку из буфера обмена, пожалуйста воспользуйтесь кнопкой
                <q-btn no-caps dense class="q-px-sm" color="primary" size="13px" @click="loadBufferClick">
                    <q-icon class="q-mr-xs" name="la la-comment" size="24px" />
                    Из буфера обмена
                </q-btn>
                на странице загрузки.
            </div>
        </Dialog>
    </div>
</template>

<script>
//-----------------------------------------------------------------------------
import vueComponent from '../../vueComponent.js';

import Dialog from '../../share/Dialog.vue';
import * as utils from '../../../share/utils';
import {versionHistory} from '../versionHistory';

const componentOptions = {
    components: {
        Dialog
    },
    watch: {
        settings: function() {
            this.loadSettings();
        },
    },
};
class ReaderDialogs {
    _options = componentOptions;

    whatsNewVisible = false;
    whatsNewContent = '';
    donationVisible = false;
    urlHelpVisible = false;

    created() {
        this.commit = this.$store.commit;
        this.loadSettings();
    }

    mounted() {
    }

    async init() {
        await this.showWhatsNew();
        await this.showDonation();
    }

    loadSettings() {
        const settings = this.settings;
        this.showWhatsNewDialog = settings.showWhatsNewDialog;
        this.showDonationDialog = settings.showDonationDialog;
    }

    async showWhatsNew() {
        const whatsNew = versionHistory[0];
        if (this.showWhatsNewDialog &&
            whatsNew.showUntil >= utils.formatDate(new Date(), 'coDate') &&
            this.whatsNewHeader != this.whatsNewContentHash) {
            await utils.sleep(2000);
            this.whatsNewContent = 'Версия ' + this.whatsNewHeader + whatsNew.content;
            this.whatsNewVisible = true;
        }
    }

    async showDonation() {
        const today = utils.formatDate(new Date(), 'coMonth');

        if ((this.mode == 'omnireader' || this.mode == 'liberama.top') && this.showDonationDialog && this.donationRemindDate != today) {
            await utils.sleep(3000);
            this.donationVisible = true;
        }
    }

    async showUrlHelp() {
        this.urlHelpVisible = true;
    }

    loadBufferClick() {
        this.$emit('load-buffer-toggle');
        this.urlHelpVisible = false;
    }

    donationDialogRemind() {
        this.donationVisible = false;
        this.commit('reader/setDonationRemindDate', utils.formatDate(new Date(), 'coMonth'));
    }

    makeDonation() {
        utils.makeDonation();
        this.donationDialogRemind();
    }

    openDonate() {
        this.$emit('donate-toggle');
    }

    async copyLink(link) {
        const result = await utils.copyTextToClipboard(link);
        if (result)
            this.$root.notify.success(`Ссылка ${link} успешно скопирована в буфер обмена`);
        else
            this.$root.notify.error('Копирование не удалось');
    }

    openVersionHistory() {
        this.whatsNewVisible = false;
        this.$emit('version-history-toggle');
    }

    whatsNewDisable() {
        this.whatsNewVisible = false;
        this.commit('reader/setWhatsNewContentHash', this.whatsNewHeader);
    }

    get whatsNewHeader() {
        return `${versionHistory[0].version} (${versionHistory[0].releaseDate})`;
    }

    get mode() {
        return this.$store.state.config.mode;
    }

    get settings() {
        return this.$store.state.reader.settings;
    }

    get whatsNewContentHash() {
        return this.$store.state.reader.whatsNewContentHash;
    }

    get donationRemindDate() {
        return this.$store.state.reader.donationRemindDate;
    }

    keyHook() {
        if (this.$refs.dialog1.active || this.$refs.dialog2.active || this.$refs.dialog3.active)
            return true;
        return false;
    }
}

export default vueComponent(ReaderDialogs);
//-----------------------------------------------------------------------------
</script>

<style scoped>
.clickable {
    color: blue;
    text-decoration: underline;
    cursor: pointer;
}

.copy-icon {
    cursor: pointer;
    font-size: 120%;
    color: blue;
}
</style>
