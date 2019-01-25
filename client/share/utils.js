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

export function formatDate(d, format) {
    if (!format)
        format = 'normal';

    switch (format) {
        case 'normal':
            return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()} ` + 
                `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    }
    
}