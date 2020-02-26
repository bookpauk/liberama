<template>
    <div class="hidden"></div>
</template>

<script>
//-----------------------------------------------------------------------------
import Vue from 'vue';
import Component from 'vue-class-component';

export default @Component({
})
class Notify extends Vue {
    notify(opts) {
        let {
            caption = null,
            captionColor = 'black',
            color = 'positive',
            icon = '',
            iconColor = 'white',
            message = '',
            messageColor = 'black',
        } = opts;

        caption = (caption ? `<div style="font-size: 120%; color: ${captionColor}"><b>${caption}</b></div><br>` : '');
        return this.$q.notify({
            position: 'top-right',
            color,
            textColor: iconColor,
            icon,
            actions: [{icon: 'la la-times notify-button-icon', color: 'black'}],
            html: true,

            message: 
                `<div style="max-width: 350px;">
                    ${caption}
                    <div style="color: ${messageColor}; overflow-wrap: break-word; word-wrap: break-word;">${message}</div>
                </div>`
        });
    }

    success(message, caption) {
        this.notify({color: 'positive', icon: 'la la-check-circle', message, caption});
    }

    warning(message, caption) {
        this.notify({color: 'warning', icon: 'la la-exclamation-circle', message, caption});
    }

    error(message, caption) {
        this.notify({color: 'negative', icon: 'la la-exclamation-circle', messageColor: 'yellow', captionColor: 'white', message, caption});
    }

    info(message, caption) {
        this.notify({color: 'info', icon: 'la la-bell', message, caption});
    }
}
//-----------------------------------------------------------------------------
</script>
