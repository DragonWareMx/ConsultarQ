const crypto = require('crypto');

const algorithm = 'aes-256-ctr';
const secretKey = process.env.SECRET_KEY;
const iv = process.env.SECRET_IV;

const encrypt = (text) => {

    const cipher = crypto.createCipheriv(algorithm, secretKey, iv);

    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);

    return encrypted.toString('hex')
};

const decrypt = (hash) => {

    const decipher = crypto.createDecipheriv(algorithm, secretKey, iv);

    const decrpyted = Buffer.concat([decipher.update(Buffer.from(hash, 'hex')), decipher.final()]);

    return decrpyted.toString();
};

module.exports = {
    encrypt,
    decrypt
};