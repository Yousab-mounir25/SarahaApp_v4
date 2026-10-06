import { randomInt } from "node:crypto";

export const createOtp = () => {

    return randomInt(
        100000,
        1000000
    ).toString();

};