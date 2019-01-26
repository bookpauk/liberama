function parseSync(xstr, options) {
    const dummy = () => {};
    let {onStartNode: _onStartNode = dummy,
        onEndNode: _onEndNode = dummy,
        onTextNode: _onTextNode = dummy,
        onCdata: _onCdata = dummy,
        onComment: _onComment = dummy,
        onProgress: _onProgress = dummy,
        innerCut = new Set()
    } = options;

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
        let singleTag = false;

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
            if (xstr[right - 1] === '/') {
                singleTag = true;
                rightData--;
            }
        }

        let tagData = xstr.substr(leftData + 1, rightData - leftData - 1);

        if (inCdata) {
            _onCdata(tagData, cutCounter, cutTag);
        } else if (inComment) {
            _onComment(tagData, cutCounter, cutTag);
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

            _onTextNode(text, cutCounter, cutTag);

            let endTag = (singleTag ? tag : '');
            if (tag === '' || tag[0] !== '/') {
                _onStartNode(tag, tail, singleTag, cutCounter, cutTag);
            } else {
                endTag = tag.substr(1);
            }

            if (endTag)
                _onEndNode(endTag, tail, singleTag, cutCounter, cutTag);

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
            _onProgress(Math.round(right/(len + 1)*100));
            nextProg += progStep;
        }
        i = right + 1;
    }

    if (i < len) {
        if (inCdata) {
            _onCdata(xstr.substr(i, len - i), cutCounter, cutTag);
        } else if (inComment) {
            _onComment(xstr.substr(i, len - i), cutCounter, cutTag);
        } else {
            _onTextNode(xstr.substr(i, len - i), cutCounter, cutTag);
        }
    }

    _onProgress(100);
}

//асинхронная копия parseSync
//делается заменой "_on" => "await _on" после while
async function parse(xstr, options) {
    const dummy = () => {};
    let {onStartNode: _onStartNode = dummy,
        onEndNode: _onEndNode = dummy,
        onTextNode: _onTextNode = dummy,
        onCdata: _onCdata = dummy,
        onComment: _onComment = dummy,
        onProgress: _onProgress = dummy,
        innerCut = new Set()
    } = options;

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
        let singleTag = false;

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
            if (xstr[right - 1] === '/') {
                singleTag = true;
                rightData--;
            }
        }

        let tagData = xstr.substr(leftData + 1, rightData - leftData - 1);

        if (inCdata) {
            await _onCdata(tagData, cutCounter, cutTag);
        } else if (inComment) {
            await _onComment(tagData, cutCounter, cutTag);
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

            await _onTextNode(text, cutCounter, cutTag);

            let endTag = (singleTag ? tag : '');
            if (tag === '' || tag[0] !== '/') {
                await _onStartNode(tag, tail, singleTag, cutCounter, cutTag);
            } else {
                endTag = tag.substr(1);
            }

            if (endTag)
                await _onEndNode(endTag, tail, singleTag, cutCounter, cutTag);

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
            await _onProgress(Math.round(right/(len + 1)*100));
            nextProg += progStep;
        }
        i = right + 1;
    }

    if (i < len) {
        if (inCdata) {
            await _onCdata(xstr.substr(i, len - i), cutCounter, cutTag);
        } else if (inComment) {
            await _onComment(xstr.substr(i, len - i), cutCounter, cutTag);
        } else {
            await _onTextNode(xstr.substr(i, len - i), cutCounter, cutTag);
        }
    }

    await _onProgress(100);
}

module.exports = {
    parseSync,
    parse
}