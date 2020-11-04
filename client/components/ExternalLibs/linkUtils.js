export function addProtocol(url) {
    if ((url.indexOf('http://') != 0) && (url.indexOf('https://') != 0))
        return 'http://' + url;
    return url;
}

export function removeProtocol(url) {
    return url.replace(/(^\w+:|^)\/\//, '');
}

export function getOrigin(url) {
    const parsed = new URL(url);
    return parsed.origin;
}

export function removeOrigin(url) {
    const parsed = new URL(url);
    const result = url.substring(parsed.origin.length);
    return (result ? result : '/');
}

export function getRootIndexByUrl(groups, url) {
    const origin = getOrigin(url);
    for (let i = 0; i < groups.length; i++) {
        if (groups[i].r == origin)
            return i;
    }
    return -1;
}

export function getSafeRootIndexByUrl(groups, url) {
    let index = -1;
    try {
        index = getRootIndexByUrl(groups, url);
    } catch(e) {
        //
    }
    return index;
}

export function getListItemByLink(list, link) {
    for (const item of list) {
        if (item.l == link)
            return item;
    }
    return null;
}

