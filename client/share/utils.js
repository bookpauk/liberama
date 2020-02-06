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

export function getObjDiff(oldObj, newObj) {
    const result = {__isDiff: true, change: {}, add: {}, del: []};

    for (const key of Object.keys(oldObj)) {
        if (newObj.hasOwnProperty(key)) {
            if (!_.isEqual(oldObj[key], newObj[key])) {
                if (_.isObject(oldObj[key]) && _.isObject(newObj[key])) {
                    result.change[key] = getObjDiff(oldObj[key], newObj[key]);
                } else {
                    result.change[key] = _.cloneDeep(newObj[key]);
                }
            }
        } else {
            result.del.push(key);
        }
    }

    for (const key of Object.keys(newObj)) {
        if (!oldObj.hasOwnProperty(key)) {
            result.add[key] = _.cloneDeep(newObj[key]);
        }
    }

    return result;
}

export function isObjDiff(diff) {
    return (_.isObject(diff) && diff.__isDiff);
}

export function isEmptyObjDiff(diff) {
    return (!_.isObject(diff) || !diff.__isDiff ||
        (!Object.keys(diff.change).length &&
            !Object.keys(diff.add).length &&
            !diff.del.length
        )
    );
}

export function applyObjDiff(obj, diff, isAddChanged) {
    const result = _.cloneDeep(obj);
    if (!diff.__isDiff)
        return result;

    const change = diff.change;
    for (const key of Object.keys(change)) {
        if (result.hasOwnProperty(key)) {
            if (_.isObject(change[key])) {
                result[key] = applyObjDiff(result[key], change[key], isAddChanged);
            } else {
                result[key] = _.cloneDeep(change[key]);
            }
        } else if (isAddChanged) {
            result[key] = _.cloneDeep(change[key]);
        }
    }

    for (const key of Object.keys(diff.add)) {
        result[key] = _.cloneDeep(diff.add[key]);
    }

    for (const key of diff.del) {
        delete result[key];
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