import { model } from "mongoose";
import { create, findOne } from "../../common/repository/db.repository.js";
import { UserModel } from "../../DB/model/user.model.js";
import {
  BadException,
  ConflictException,
  NotFoundException,
  TooManyRequestException,
} from "../../common/exceptions/index.js";
import {
  decryption,
  encryption,
  compare,
  hash,
  generateToken,
  createLoginCredentials,
  createRevoketoken,
  userBaseRevokeToken,
} from "../../common/security/index.js";
import jwt from "jsonwebtoken";
import {
  ACCESS_TOKEN_EXPIRESIN,
  REFRESH_TOKEN_EXPIRESIN,
  REFRESH_USER_TOKEN_SIGNATURE,
  WEB_CLIENT_IDS,
} from "../../config.js";
import { ProviderEnum, RoleEnum } from "../../common/enum/user.enum.js";
import { OAuth2Client } from "google-auth-library";
import { incrBy, keys, set, ttl,get , del, expire } from "../../common/services/cache.service.js";
import {
  sendEmail,
  userEmailKey,
  userEmailTrialsKey,
} from "../../common/utils/Email/send.email.js";
import { emailEvent } from "../../common/events/email.event.js";
import { EmailSubjectEnum } from "../../common/enum/email.enum.js";
import { createOtp } from "../../common/utils/otp.js";
/**
 * {
  payload: {
    iss: 'https://accounts.google.com',
    azp: '493353823461-4va0tbdp7lnmt5l1ok7u2pq1c2fhkbgu.apps.googleusercontent.com',
    aud: '493353823461-4va0tbdp7lnmt5l1ok7u2pq1c2fhkbgu.apps.googleusercontent.com',
    sub: '110519885660650122691',
    email: 'yousab.mounir@gmail.com',
    email_verified: true,
    nonce: 'not_provided',
    nbf: 1790068273,
    name: 'Yousab Mounir',
    picture: 'https://lh3.googleusercontent.com/a/ACg8ocJlCyZ8aWvhcRpQs_nbW1S3TTl_lxh4qspqq19_wdr4VvgWuF8P=s96-c',
    given_name: 'Yousab',
    family_name: 'Mounir',
    iat: 1790068573,
    exp: 1790072173,
    jti: '3f58930c5294d0aa78a42abe54eed53bd875d7aa'
  }
}
 */

const client = new OAuth2Client();
async function verifyGoogleAccount(idToken) {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: WEB_CLIENT_IDS, // Specify the CLIENT_ID of the app that accesses the backend
  });
  const payload = ticket.getPayload();
  if (!payload.email_verified) {
    throw BadException("not verified email");
  }
  return payload;
}

// export const loginWithGoogle = async (user, issuer) => {
//   return await createLoginCredentials({user:existingUser ,issuer})
// }

export const signupWithGmail = async ({ idToken, issuer }) => {
  //after i receive the idToken from the frontend
  //I talked to google to verify the token , then i receive from google the payload that contain the data
  const { email, name, picture } = await verifyGoogleAccount(idToken);
  const existAccount = await findOne({
    model: UserModel,
    filter: { email },
  });
  if (existAccount) {
    if (existAccount.provider != ProviderEnum.GOOGLE) {
      throw ConflictException("invalid account provider");
    }
    //login wit google
    return {
      status: 200,
      data: await createLoginCredentials({ user: existAccount, issuer }),
    };
  }

  //if not exist --> add user
  const user = await create({
    model: UserModel,
    data: {
      email,
      username: name,
      image: picture,
      confirmEmail: new Date(),
      provider: ProviderEnum.GOOGLE,
    },
  });
  return {
    status: 201,
    data: await createLoginCredentials({ user: existAccount, issuer }),
  };
};

//create function to generate otp and send it to the user email
//this for resend email
const sendEmailOtp = async ({ email, subject , expiresIn=120 , maxTrials=3 , blockIn=300}) => {
  const existOtp_ttl = await ttl({key: userEmailKey({ email, subject })})
  if(existOtp_ttl>0){
    throw ConflictException(`sorry we cannot create otp while the old one still valid, please try again after ${existOtp_ttl}`)
  }
  const oldTrials = await get({key:userEmailTrialsKey(email,subject)})
  if(oldTrials >=maxTrials){
    throw TooManyRequestException("Max otp trials has been reached")
  }

  const code = createOtp();
  await set({
    key: userEmailKey({ email, subject }),
    value: await hash({ plainText: code.toString() }), //convert the otp to string before hashing it
    ttl: expiresIn,
  });

  const currentTrials=await incrBy({key:userEmailTrialsKey(email,subject)})
  //when the user reached the trial number 3 ---> block his account for 5 mins
  if(currentTrials == 3){
    await expire({key:userEmailTrialsKey(email,subject) , ttl:blockIn}) //5*60 =300sec
  }
  emailEvent.emit("sendEmail", {
    recipient: { to: email },
    subject: EmailSubjectEnum.CONFIRM_EMAIL,
    data: { code },
  });
};

export const signup = async (inputs) => {
  const { username, email, password, phone, age, role } = inputs;
  const existingUser = await findOne({
    filter: { email },
    options: { select: "email" },
    model: UserModel,
  });
  if (existingUser) {
    throw ConflictException("Email exist");
  }
  const user = await create({
    data: {
      username,
      email,
      password: await hash({ plainText: password }), //hash the password before saving to the database
      phone: await encryption(phone), //encrypt the phone number before saving to the database
      age,
      role,
    },
    model: UserModel,
  });

 await sendEmailOtp({email , subject:EmailSubjectEnum.CONFIRM_EMAIL})

  return user;
};

//send confirm email
export const confirmEmail = async (inputs) => {
  const { otp, email } = inputs;
  const account = await findOne({
    filter: {
      email,
      provider: ProviderEnum.SYSTEM,
      confirmEmail: { $exists: false },
    },
    options: { select: "email" },
    model: UserModel,
  });
  if (!account) {
    throw NotFoundException("Invalid email or account already confirmed");
  }

  const hashOtp = await get({
    key: userEmailKey({ email, subject: EmailSubjectEnum.CONFIRM_EMAIL }),
  });

  if (!hashOtp || !(await compare(otp.toString(), hashOtp))) {
    //ttl is expired or the otp is not match with the hashed otp
    throw BadException("Invalid OTP");
  }

  account.confirmEmail = new Date();
  await account.save();
  await del({
    key: await keys({prefix:userEmailKey({email,subject:EmailSubjectEnum.CONFIRM_EMAIL})}),
  }); //delete the otp from redis after confirming the email
  return;
};

// resend confirm email again
export const resendConfirmEmail = async (inputs) => {
  const { email } = inputs;
  const account = await findOne({
    filter: {
      email,
      provider: ProviderEnum.SYSTEM,
      confirmEmail: { $exists: false },
    },
    options: { select: "email" },
    model: UserModel,
  });
  if (!account) {
    throw NotFoundException("Invalid email or account already confirmed");
  }

  await sendEmailOtp({email,subject:EmailSubjectEnum.CONFIRM_EMAIL})
  return;
};

//resendEmail--> forget password
export const requestForgotPasswordCode = async (inputs) => {
  const { email } = inputs;
  const account = await findOne({
    filter: {
      email,
      provider: ProviderEnum.SYSTEM,
      confirmEmail: { $exists: true },
    },
    options: { select: "email" },
    model: UserModel,
  });
  if (!account) {
    throw NotFoundException("Invalid email or account already confirmed");
  }

  await sendEmailOtp({email,subject:EmailSubjectEnum.FORGET_PASSWORD})
  return;
};

export const verifyForgotPasswordCode = async (inputs) => {
  const { otp, email } = inputs;
  const account = await findOne({
    filter: {
      email,
      provider: ProviderEnum.SYSTEM,
      confirmEmail: { $exists: true },
    },
    options: { select: "email" },
    model: UserModel,
  });
  if (!account) {
    throw NotFoundException("Invalid email or account already confirmed");
  }

  const hashOtp = await get({
    key: userEmailKey({ email, subject: EmailSubjectEnum.FORGET_PASSWORD }),
  });

  if (!hashOtp || !(await compare(otp.toString(), hashOtp))) {
    //ttl is expired or the otp is not match with the hashed otp
    throw BadException("Invalid OTP");
  }
  return account;
};
export const resetForgotPassword = async (inputs) => {
  const { otp, email , password } = inputs;
  const account = await verifyForgotPasswordCode({otp , email})
  account.password = hash({plainText:password})
  account.changeCredentialsTime = new Date()
  await account.save()
  const result = await Promise.all([keys({prefix:userBaseRevokeToken({userId:account._id})}) , keys({prefix:userEmailKey({email,subject:EmailSubjectEnum.FORGET_PASSWORD})}) ])
  await del({
    key: [...result[0] , ...result[1]]
  });

  

  return;
};

export const login = async (inputs, issuer) => {
  const { email, password } = inputs;
  const existingUser = await findOne({
    filter: {
      email,
      provider: ProviderEnum.SYSTEM,
      confrimEmail: { $exists: true },
    },
    model: UserModel,
  });
  if (!existingUser) {
    throw NotFoundException("invalid login credentials"); // check for email
  }
  const match = await compare(password, existingUser.password); //check for password
  if (!match) {
    throw NotFoundException("invalid login credentials");
  }
  return await createLoginCredentials({ user: existingUser, issuer });
};
