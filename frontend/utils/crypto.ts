import CryptoJS from 'crypto-js';

export interface EncryptedData {
    encryptedContent: string;
    iv: string;
    salt?: string; // Optional if we use raw key
    key: string; // The secret key to be shared via URL
}

export const generateKey = (): string => {
    return CryptoJS.lib.WordArray.random(256 / 8).toString();
};

export const encryptNote = (content: string): EncryptedData => {
    const key = CryptoJS.lib.WordArray.random(256 / 8);
    const iv = CryptoJS.lib.WordArray.random(128 / 8);

    const encrypted = CryptoJS.AES.encrypt(content, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });

    return {
        encryptedContent: encrypted.ciphertext.toString(CryptoJS.enc.Base64),
        iv: iv.toString(CryptoJS.enc.Hex),
        key: key.toString(CryptoJS.enc.Hex)
    };
};

export const decryptNote = (encryptedContent: string, keyHex: string, ivHex: string): string => {
    const key = CryptoJS.enc.Hex.parse(keyHex);
    const iv = CryptoJS.enc.Hex.parse(ivHex);
    const ciphertext = CryptoJS.enc.Base64.parse(encryptedContent);

    const decrypted = CryptoJS.AES.decrypt(
        { ciphertext: ciphertext } as any,
        key,
        {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        }
    );

    return decrypted.toString(CryptoJS.enc.Utf8);
};
