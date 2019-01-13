export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function stringToHex(str) {
    let result = '';
    for (let i = 0; i < str.length; i++) {
        result += str.charCodeAt(i).toString(16);
    }
    return result;
}

export function hexToString(str) {
    let result = '';
    for (let i = 0; i < str.length; i += 2) {
        result += String.fromCharCode(parseInt(str.substr(i, 2), 16));
    }
    return result;
}