function parseSync(xstr, options) {
    let {onStartNode, onEndNode, onTextNode, onCdata, onComment, onProgress, innerCut} = options;

    if (!onStartNode)
        onStartNode = () => {};
    if (!onEndNode)
        onEndNode = () => {};
    if (!onTextNode)
        onTextNode = () => {};
    if (!onCdata)
        onCdata = () => {};
    if (!onComment)
        onComment = () => {};
    if (!onProgress)
        onProgress = () => {};

    if (!innerCut)
        innerCut = new Set();

    let i = 0;
    const len = xstr.length;
    const progStep = len/10;
    let nextProg = 0;

    let cutCounter = 0;
    let cutTag = '';
    let inCdata;
    let inComment;
    while (i < len) {
        inCdata = false;
        inComment = false;

        let left = xstr.indexOf('<', i);
        if (left < 0)
            break;
        let leftData = left;

        if (left < len - 2 && xstr[left + 1] == '!') {
            if (xstr[left + 2] == '-') {
                const leftComment = xstr.indexOf('<!--', left);
                if (leftComment == left) {
                    inComment = true;
                    leftData = left + 3;
                }
            }

            if (!inComment && xstr[left + 2] == '[') {
                const leftCdata = xstr.indexOf('<![CDATA[', left);
                if (leftCdata == left) {
                    inCdata = true;
                    leftData = left + 8;
                }
            }
        }

        let right = null;
        let rightData = null;
        if (inCdata) {
            rightData = xstr.indexOf(']]>', leftData + 1);
            if (rightData < 0)
                break;
            right = rightData + 2;
        } else if (inComment) {
            rightData = xstr.indexOf('-->', leftData + 1);
            if (rightData < 0)
                break;
            right = rightData + 2;
        } else {
            rightData = xstr.indexOf('>', leftData + 1);
            if (rightData < 0)
                break;
            right = rightData;
        }

        let tagData = xstr.substr(leftData + 1, rightData - leftData - 1);

        if (inCdata) {
            onCdata(tagData, left, cutCounter, cutTag);
        } else if (inComment) {
            onComment(tagData, left, cutCounter, cutTag);
        } else {
            let tag = '';
            let tail = '';
            const firstSpace = tagData.indexOf(' ');
            if (firstSpace >= 0) {
                tail = tagData.substr(firstSpace);
                tag = tagData.substr(0, firstSpace);
            } else {
                tag = tagData;
            }
            tag = tag.toLowerCase();

            const text = xstr.substr(i, left - i);

            onTextNode(text, left, cutCounter, cutTag);

            let endTag = '';
            if (tag === '' || tag[0] !== '/') {
                onStartNode(tag, tail, left, cutCounter, cutTag);
            } else {
                endTag = tag.substr(1);
                onEndNode(endTag, tail, left, cutCounter, cutTag);
            }

            if (innerCut.has(tag) && (!cutCounter || cutTag === tag)) {
                if (!cutCounter)
                    cutTag = tag;
                cutCounter++;
            }

            if (cutTag === endTag) {
                cutCounter = (cutCounter > 0 ? cutCounter - 1 : 0);
                if (!cutCounter)
                    cutTag = '';
            }
        }

        if (right >= nextProg) {
            const prog = Math.round(right/(len + 1)*100);
            onProgress((prog >= 100 ? 99 : prog));
            nextProg += progStep;
        }
        i = right + 1;
    }

    if (i < len) {
        if (inCdata) {
            onCdata(xstr.substr(i, len - i), len - 1, cutCounter, cutTag);
        } else if (inComment) {
            onComment(xstr.substr(i, len - i), len - 1, cutCounter, cutTag);
        } else {
            onTextNode(xstr.substr(i, len - i), len - 1, cutCounter, cutTag);
        }
    }

    onProgress(100);
}

//асинхронная копия parseSync
async function parse(xstr, options) {
    let {onStartNode, onEndNode, onTextNode, onCdata, onComment, onProgress, innerCut} = options;

    if (!onStartNode)
        onStartNode = () => {};
    if (!onEndNode)
        onEndNode = () => {};
    if (!onTextNode)
        onTextNode = () => {};
    if (!onCdata)
        onCdata = () => {};
    if (!onComment)
        onComment = () => {};
    if (!onProgress)
        onProgress = () => {};

    if (!innerCut)
        innerCut = new Set();

    let i = 0;
    const len = xstr.length;
    const progStep = len/10;
    let nextProg = 0;

    let cutCounter = 0;
    let cutTag = '';
    let inCdata;
    let inComment;
    while (i < len) {
        inCdata = false;
        inComment = false;

        let left = xstr.indexOf('<', i);
        if (left < 0)
            break;
        let leftData = left;

        if (left < len - 2 && xstr[left + 1] == '!') {
            if (xstr[left + 2] == '-') {
                const leftComment = xstr.indexOf('<!--', left);
                if (leftComment == left) {
                    inComment = true;
                    leftData = left + 3;
                }
            }

            if (!inComment && xstr[left + 2] == '[') {
                const leftCdata = xstr.indexOf('<![CDATA[', left);
                if (leftCdata == left) {
                    inCdata = true;
                    leftData = left + 8;
                }
            }
        }

        let right = null;
        let rightData = null;
        if (inCdata) {
            rightData = xstr.indexOf(']]>', leftData + 1);
            if (rightData < 0)
                break;
            right = rightData + 2;
        } else if (inComment) {
            rightData = xstr.indexOf('-->', leftData + 1);
            if (rightData < 0)
                break;
            right = rightData + 2;
        } else {
            rightData = xstr.indexOf('>', leftData + 1);
            if (rightData < 0)
                break;
            right = rightData;
        }

        let tagData = xstr.substr(leftData + 1, rightData - leftData - 1);

        if (inCdata) {
            await onCdata(tagData, left, cutCounter, cutTag);
        } else if (inComment) {
            await onComment(tagData, left, cutCounter, cutTag);
        } else {
            let tag = '';
            let tail = '';
            const firstSpace = tagData.indexOf(' ');
            if (firstSpace >= 0) {
                tail = tagData.substr(firstSpace);
                tag = tagData.substr(0, firstSpace);
            } else {
                tag = tagData;
            }
            tag = tag.toLowerCase();

            const text = xstr.substr(i, left - i);

            await onTextNode(text, left, cutCounter, cutTag);

            let endTag = '';
            if (tag === '' || tag[0] !== '/') {
                await onStartNode(tag, tail, left, cutCounter, cutTag);
            } else {
                endTag = tag.substr(1);
                await onEndNode(endTag, tail, left, cutCounter, cutTag);
            }

            if (innerCut.has(tag) && (!cutCounter || cutTag === tag)) {
                if (!cutCounter)
                    cutTag = tag;
                cutCounter++;
            }

            if (cutTag === endTag) {
                cutCounter = (cutCounter > 0 ? cutCounter - 1 : 0);
                if (!cutCounter)
                    cutTag = '';
            }
        }

        if (right >= nextProg) {
            const prog = Math.round(right/(len + 1)*100);
            await onProgress((prog >= 100 ? 99 : prog));
            nextProg += progStep;
        }
        i = right + 1;
    }

    if (i < len) {
        if (inCdata) {
            await onCdata(xstr.substr(i, len - i), len - 1, cutCounter, cutTag);
        } else if (inComment) {
            await onComment(xstr.substr(i, len - i), len - 1, cutCounter, cutTag);
        } else {
            await onTextNode(xstr.substr(i, len - i), len - 1, cutCounter, cutTag);
        }
    }

    await onProgress(100);
}

module.exports = {
    parseSync,
    parse
}