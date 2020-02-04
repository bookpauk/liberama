export function success(vue, message, caption) {
    caption = (caption ? `<div style="font-size: 120%; color: black"><b>${caption}</b></div><br>` : '');
    return vue.$q.notify({
        position: 'top-right',
        color: 'positive',
        textColor: 'white',
        icon: 'o_check_circle',
        actions: [{icon: 'o_close', color: 'black'}],
        html: true,

        message: 
            `<div style="max-width: 350px;">
                ${caption}
                <div style="color: black; overflow-wrap: break-word; word-wrap: break-word;">${message}</div>
            </div>`
    });
}

export function error(vue, message, caption) {
    caption = (caption ? `<div style="font-size: 120%; color: yellow"><b>${caption}</b></div><br>` : '');
    return vue.$q.notify({
        position: 'top-right',
        color: 'negative',
        textColor: 'white',
        icon: 'o_error_outline',
        actions: [{icon: 'o_close', color: 'black'}],
        html: true,

        message: 
            `<div style="max-width: 350px;">
                ${caption}
                <div style="color: yellow; overflow-wrap: break-word; word-wrap: break-word;">${message}</div>
            </div>`
    });
}

export function info(vue, message, caption) {
    caption = (caption ? `<div style="font-size: 120%; color: black"><b>${caption}</b></div><br>` : '');
    return vue.$q.notify({
        position: 'top-right',
        color: 'info',
        textColor: 'white',
        icon: 'o_notifications',
        actions: [{icon: 'o_close', color: 'black'}],
        html: true,

        message: 
            `<div style="max-width: 350px;">
                ${caption}
                <div style="color: black; overflow-wrap: break-word; word-wrap: break-word;">${message}</div>
            </div>`
    });
}
