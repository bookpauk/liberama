import {Buffer} from 'safe-buffer';

//не менять
const iv = Buffer.from('B6E2XejNh2dS');
let aesKeys = {};

export async function aesKeyFromPassword(password) {
    return await window.crypto.subtle.importKey(
        "raw", //only "raw" is allowed
        Buffer.from(password), //your password
        {
            name: "PBKDF2",
        },
        false, //whether the key is extractable (i.e. can be used in exportKey)
        ["deriveKey"] //can be any combination of "deriveKey" and "deriveBits"
    ).then((key) => {
        return window.crypto.subtle.deriveKey(
            {
                "name": "PBKDF2",
                salt: Buffer.from('Liberama project is awesome'),//не менять
                iterations: 1000,
                hash: {name: "SHA-256"}, //can be "SHA-1", "SHA-256", "SHA-384", or "SHA-512"
            },
            key, //your key from generateKey or importKey
            { //the key type you want to create based on the derived bits
                name: "AES-GCM", //can be any AES algorithm ("AES-CTR", "AES-CBC", "AES-CMAC", "AES-GCM", "AES-CFB", "AES-KW", "ECDH", "DH", or "HMAC")
                //the generateKey parameters for that type of algorithm
                length: 256, //can be  128, 192, or 256
            },
            false, //whether the derived key is extractable (i.e. can be used in exportKey)
            ["encrypt", "decrypt"] //limited to the options in that algorithm's importKey
        );
    });
}

export async function aesEncrypt(data, password) {
    if (!aesKeys[password])
        aesKeys[password] = await aesKeyFromPassword(password);

    const key = aesKeys[password];

    return await window.crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv
        },
        key, //from generateKey or importKey above
        data //ArrayBuffer of data you want to encrypt
    );
}

export async function aesDecrypt(data, password) {
    if (!aesKeys[password])
        aesKeys[password] = await aesKeyFromPassword(password);

    const key = aesKeys[password];

    return await window.crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            iv
        },
        key, //from generateKey or importKey above
        data //ArrayBuffer of the data
    );
}

export async function sha256(data) {
    return await crypto.subtle.digest("SHA-256", Buffer.from(data));
}
