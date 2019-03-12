import baseX from 'base-x';
import PAKO from 'pako';
import {Buffer} from 'safe-buffer';

export const pako = PAKO;

const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const bs58 = baseX(BASE58);
const bs64 = baseX(BASE64);

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
    return bs58.encode(data);
}

export function fromBase58(data) {
    return bs58.decode(data);
}

export function toBase64(data) {
    return bs64.encode(data);
}

export function fromBase64(data) {
    return bs64.decode(data);
}
