export function notify(vue, opts) {
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
    return vue.$q.notify({
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

export function success(vue, message, caption) {
    notify(vue, {color: 'positive', icon: 'la la-check-circle', message, caption});
}

export function error(vue, message, caption) {
    notify(vue, {color: 'negative', icon: 'la la-exclamation-circle', messageColor: 'yellow', message, caption});
}

export function info(vue, message, caption) {
    notify(vue, {color: 'info', icon: 'la la-bell', message, caption});
}
