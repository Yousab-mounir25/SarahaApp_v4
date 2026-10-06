import bcrypt, { genSalt } from "bcrypt";
import argon2 from "argon2";

export const hash = async ({ plainText, rounds = 12, minor = "b" } = {}) => {
  const salt = (await bcrypt.genSalt(rounds, minor)).toString();
  return await bcrypt.hash(plainText, salt);
};

export const compare = async (plainText, cipherText) => {
  return await bcrypt.compare(plainText, cipherText);
};
