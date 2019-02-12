export default async function restoreOldSettings(settings, bookManager, commit) {
    const oldSets = localStorage['colorSetting'];
    let isOld = false;
    for (let i = 0; i < localStorage.length; i++) {
        let key = unescape(localStorage.key(i));
        if (key.indexOf('bpr-book-') == 0)
            isOld = true;
    }

    if (isOld || oldSets) {
        let newSettings = null;
        if (oldSets) {
            const [textColor, backgroundColor, lineStep, , , statusBarHeight, scInt] = unescape(oldSets).split('|');

            const fontSize = Math.round(lineStep*0.8);
            const scrollingDelay = fontSize*scInt;

            newSettings = Object.assign({}, settings, {
                textColor,
                backgroundColor,
                fontSize,
                statusBarHeight: statusBarHeight*1,
                scrollingDelay,
            });
        }

        for (let i = 0; i < localStorage.length; i++) {
            let key = localStorage.key(i);
            if (key.indexOf('bpr-') == 0) {
                let v = unescape(localStorage[key]);
                key = unescape(key);

                if (key.lastIndexOf('=timestamp') == key.length - 10) {
                    continue;
                }

                if (key.indexOf('bpr-book-') == 0) {
                    const url = key.substr(9);
                    const [scrollTop, scrollHeight, ] = v.split('|');

                    const bookPosPercent = scrollTop*1/(scrollHeight*1 + 1);
                    const title = unescape(localStorage[`bpr-title-${escape(url)}`]);
                    const author = unescape(localStorage[`bpr-author-${escape(url)}`]);
                    const time = unescape(localStorage[`bpr-book-${escape(url)}=timestamp`]).split(';')[0];
                    const touchTime = Date.parse(time);

                    const bookKey = bookManager.keyFromUrl(url);
                    const recent = await bookManager.getRecentBook({key: bookKey});

                    if (!recent) {
                        await bookManager.setRecentBook({
                            key: bookKey,
                            touchTime,
                            bookPosPercent,
                            url,
                            fb2: {
                                bookTitle: title,
                                lastName: author,
                            }
                        }, true);
                    }
                }
            }
        }

        localStorage.clear();
        if (oldSets)
            commit('reader/setSettings', newSettings);
    }
}