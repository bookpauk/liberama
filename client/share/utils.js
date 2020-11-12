import _ from 'lodash';
import baseX from 'base-x';
import PAKO from 'pako';
import {Buffer} from 'safe-buffer';
import sjclWrapper from './sjclWrapper';

export const pako = PAKO;

const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const bs58 = baseX(BASE58);

export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function stringToHex(str) {
    return Buffer.from(str).toString('hex');
}

export function hexToString(str) {
    return Buffer.from(str, 'hex').toString();
}

export function randomArray(len) {
    const a = new Uint8Array(len);
    window.crypto.getRandomValues(a);
    return a;
}

export function randomHexString(len) {
    return Buffer.from(randomArray(len)).toString('hex');
}

export function formatDate(d, format) {
    if (!format)
        format = 'normal';

    switch (format) {
        case 'normal':
            return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()} ` + 
                `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
        case 'coDate':
            return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
        case 'noDate':
            return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()}`;
    }
    
}

export function fallbackCopyTextToClipboard(text) {
    let textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    let result = false;
    try {
         result = document.execCommand('copy');
    } catch (e) {
        //
    }

    document.body.removeChild(textArea);
    return result;
}

export async function copyTextToClipboard(text) {
    if (!navigator.clipboard) {
        return fallbackCopyTextToClipboard(text);
    }

    let result = false;
    try {
        await navigator.clipboard.writeText(text);
        result = true;
    } catch (e) {
        //
    }

    return result;
}

export function toBase58(data) {
    return bs58.encode(Buffer.from(data));
}

export function fromBase58(data) {
    return bs58.decode(data);
}

//base-x слишком тормозит, используем sjcl
export function toBase64(data) {
    return sjclWrapper.codec.base64.fromBits(
        sjclWrapper.codec.bytes.toBits(Buffer.from(data))
    );
}

//base-x слишком тормозит, используем sjcl
export function fromBase64(data) {
    return Buffer.from(sjclWrapper.codec.bytes.fromBits(
        sjclWrapper.codec.base64.toBits(data)
    ));
}

export function getObjDiff(oldObj, newObj, opts = {}) {
    const {
        exclude = [],
        excludeAdd = [],
        excludeDel = [],
    } = opts;

    const ex = new Set(exclude);
    const exAdd = new Set(excludeAdd);
    const exDel = new Set(excludeDel);

    const makeObjDiff = (oldObj, newObj, keyPath) => {
        const result = {__isDiff: true, change: {}, add: {}, del: []};

        keyPath = `${keyPath}${keyPath ? '/' : ''}`;

        for (const key of Object.keys(oldObj)) {
            const kp = `${keyPath}${key}`;

            if (newObj.hasOwnProperty(key)) {
                if (ex.has(kp))
                    continue;

                if (!_.isEqual(oldObj[key], newObj[key])) {
                    if (_.isObject(oldObj[key]) && _.isObject(newObj[key])) {
                        result.change[key] = makeObjDiff(oldObj[key], newObj[key], kp);
                    } else {
                        result.change[key] = _.cloneDeep(newObj[key]);
                    }
                }
            } else {
                if (exDel.has(kp))
                    continue;
                result.del.push(key);
            }
        }

        for (const key of Object.keys(newObj)) {
            const kp = `${keyPath}${key}`;
            if (exAdd.has(kp))
                continue;

            if (!oldObj.hasOwnProperty(key)) {
                result.add[key] = _.cloneDeep(newObj[key]);
            }
        }

        return result;
    }

    return makeObjDiff(oldObj, newObj, '');
}

export function isObjDiff(diff) {
    return (_.isObject(diff) && diff.__isDiff && diff.change && diff.add && diff.del);
}

export function isEmptyObjDiff(diff) {
    return (!isObjDiff(diff) ||
        !(Object.keys(diff.change).length ||
          Object.keys(diff.add).length ||
          diff.del.length
        )
    );
}

export function isEmptyObjDiffDeep(diff, opts = {}) {
    if (!isObjDiff(diff))
        return true;

    const {
        isApplyChange = true,
        isApplyAdd = true,
        isApplyDel = true,
    } = opts;

    let notEmptyDeep = false;
    const change = diff.change;
    for (const key of Object.keys(change)) {
        if (_.isObject(change[key]))
            notEmptyDeep |= !isEmptyObjDiffDeep(change[key], opts);
        else if (isApplyChange)
            notEmptyDeep = true;
    }

    return !(
        notEmptyDeep ||
        (isApplyAdd && Object.keys(diff.add).length) ||
        (isApplyDel && diff.del.length)
    );
}

export function applyObjDiff(obj, diff, opts = {}) {
    const {
        isAddChanged = false,
        isApplyChange = true,
        isApplyAdd = true,
        isApplyDel = true,
    } = opts;

    let result = _.cloneDeep(obj);
    if (!diff.__isDiff)
        return result;

    const change = diff.change;
    for (const key of Object.keys(change)) {
        if (result.hasOwnProperty(key)) {
            if (_.isObject(change[key])) {
                result[key] = applyObjDiff(result[key], change[key], opts);
            } else {
                if (isApplyChange)
                    result[key] = _.cloneDeep(change[key]);
            }
        } else if (isAddChanged) {
            result[key] = _.cloneDeep(change[key]);
        }
    }

    if (isApplyAdd) {
        for (const key of Object.keys(diff.add)) {
            result[key] = _.cloneDeep(diff.add[key]);
        }
    }

    if (isApplyDel && diff.del.length) {
        for (const key of diff.del) {
            delete result[key];
        }
        if (_.isArray(result))
            result = result.filter(v => v);
    }

    return result;
}

export function parseQuery(str) {
    if (typeof str != 'string' || str.length == 0)
        return {};
    let s = str.split('&');
    let s_length = s.length;
    let bit, query = {}, first, second;

    for (let i = 0; i < s_length; i++) {
        bit = s[i].split('=');
        first = decodeURIComponent(bit[0]);
        if (first.length == 0)
            continue;
        second = decodeURIComponent(bit[1]);
        if (typeof query[first] == 'undefined')
            query[first] = second;
        else
            if (query[first] instanceof Array)
                query[first].push(second);
            else
                query[first] = [query[first], second]; 
    }
    return query;
}

export function escapeXml(str) {
    return str.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
    ;
}

export function keyEventToCode(event) {
    let result = [];
    let code = event.code;

    const modCode = code.substring(0, 3);
    if (event.metaKey && modCode != 'Met')
        result.push('Meta');
    if (event.ctrlKey && modCode != 'Con')
        result.push('Ctrl');
    if (event.shiftKey && modCode != 'Shi')
        result.push('Shift');
    if (event.altKey && modCode != 'Alt')
        result.push('Alt');
    
    if (modCode == 'Dig') {
        code = code.substring(5, 6);
    } else if (modCode == 'Key') {
        code = code.substring(3, 4);
    }
    result.push(code);

    return result.join('+');
}

export function userHotKeysObjectSwap(userHotKeys) {
    let result = {};
    for (const [name, codes] of Object.entries(userHotKeys)) {
        for (const code of codes) {
            result[code] = name;
        }
    }
    return result;
}
