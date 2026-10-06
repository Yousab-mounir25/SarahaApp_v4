import crypto from 'node:crypto';
import { ENC_KEY, IV_LENGTH } from '../../config.js';
import { log } from 'node:console';

export const encryption = async(plainText)=>{
    //(1) initialize vector
    const iv = crypto.randomBytes(IV_LENGTH) // generate random bytes for iv
    const cipher = crypto.createCipheriv('aes-256-cbc' , ENC_KEY , iv)// create cipher vector using iv and encryption key
    let encryptedData= cipher.update(plainText , "utf-8" , "hex") // generate cipher text from plain text
    encryptedData+= cipher.final("hex")
    console.log({iv,cipher , encryptedData});

    return `${iv.toString("hex")}::${encryptedData}` // return iv and encrypted data in a single string
}

export const decryption = async (cipherText)=>{
    const [iv , encryptedData] = cipherText.split("::")
    console.log({iv , encryptedData});
    const iv_vector = Buffer.from(iv , "hex")// convert iv from hex to buffer
    console.log({iv_vector});
    
    const decipherVector = crypto.createDecipheriv("aes-256-cbc" , ENC_KEY , iv_vector)// create decipher vector using iv and encryption key
    let plainText = decipherVector.update(encryptedData , "hex" , "utf-8") // generate plain text from cipher text
    plainText+=decipherVector.final("utf-8")
    return plainText
}   