import jwt, { decode } from "jsonwebtoken";
import {
  ACCESS_ADMIN_TOKEN_SIGNATURE,
  ACCESS_TOKEN_EXPIRESIN,
  ACCESS_USER_TOKEN_SIGNATURE,
  REFRESH_ADMIN_TOKEN_SIGNATURE,
  REFRESH_TOKEN_EXPIRESIN,
  REFRESH_USER_TOKEN_SIGNATURE,
} from "../../config.js";
import {
  BadException,
  NotFoundException,
  UnAuthorizedException,
} from "../exceptions/error.exception.js";
import { findById } from "../repository/db.repository.js";
import { UserModel } from "../../DB/model/user.model.js";
import { TokenTypeEnum } from "../enum/security.enum.js";
import { RoleEnum } from "../enum/user.enum.js";
import { randomUUID } from "node:crypto";
import { exist, set } from "../services/cache.service.js";



export const userBaseRevokeToken = async ({ userId }) => {
  return `User::${userId.toString()}::RevokeToken::`;
};

//revoke token
export const userRevokeToken = async ({ userId, jti }) => {
  return `${userBaseRevokeToken({userId})}::${jti}`;
};

//Generate token
export const generateToken = async ({
  payload = {},
  options = {},
  secretKey = ACCESS_USER_TOKEN_SIGNATURE,
} = {}) => {
  return await jwt.sign(payload, secretKey, options);
};

// verify token
export const verifyToken = async ({
  token = "",
  secretKey = ACCESS_USER_TOKEN_SIGNATURE,
} = {}) => {
  return await jwt.verify(token, secretKey);
};

//get signature according to the role
export const getTokenSignatures = async ({ role = RoleEnum.USER } = {}) => {
  let signatures;
  switch (role) {
    case role == RoleEnum.ADMIN:
      signatures = {
        accessSignature: ACCESS_ADMIN_TOKEN_SIGNATURE,
        refreshSignature: REFRESH_ADMIN_TOKEN_SIGNATURE,
      };
      break;
    default:
      signatures = {
        accessSignature: ACCESS_USER_TOKEN_SIGNATURE,
        refreshSignature: REFRESH_USER_TOKEN_SIGNATURE,
      };
      break;
  }
  return signatures;
};

//return access or refresh token according to the role
export const getSignature = async ({
  tokenType = TokenTypeEnum.ACCESS,
  role = RoleEnum.USER,
} = {}) => {
  const signatures = await getTokenSignatures({ role });

  return tokenType == TokenTypeEnum.ACCESS
    ? signatures.accessSignature
    : signatures.refreshSignature;
};

//ensure that the user is authorized or not and check if the payload exist or not before enter the service
//to enter the service file with clean architecture
export const decodeToken = async ({
  authorization = "",
  tokenType = TokenTypeEnum.ACCESS,
} = {}) => {
  //to see the audience and extract it to know the role of user
  const decoded = jwt.decode(authorization);
  console.log({ authorization, decoded });

  console.log({ decoded });
  if (!decoded?.aud?.length) {
    throw BadException("missing token payload");
  }

  const payload = await verifyToken({
    token: authorization,
    secretKey: await getSignature({ tokenType, role: decoded.aud[0] }),
  });
  if (!payload?.sub) {
    throw BadException("missing token payload");
  }

  if (
    await exist({
      key: userRevokeToken({ userId: payload.sub, jti: payload.jti }),
    })
  ) {
    throw UnAuthorizedException("Expired login credentials");
  }

  const user = await findById({
    model: UserModel,
    id: payload.sub,
  });
  if (!user) {
    throw NotFoundException("invalid user ");
  }

  //check if the user change his credentials after the token issued or not
  if(user.changeCredentialsTime?.getTime()>payload.iat*1000){
    throw UnAuthorizedException("Expired login credentials"); 
  }

  return { user, payload };
};

//we create this method because we notice that the same code are repeated in the login and rotate token API service,
// so we create this method to avoid code duplication
export const createLoginCredentials = async ({
  user,
  issuer,
  options = {},
} = {}) => {
  const jwtid = randomUUID();
  const { accessSignature, refreshSignature } = await getTokenSignatures({
    role: user.role,
  });
  const access_token = await generateToken({
    payload: { sub: user._id },
    secretKey: accessSignature,
    options: {
      issuer,
      ...options,
      audience: [user.role],
      expiresIn: ACCESS_TOKEN_EXPIRESIN,
      jwtid,
    },
  });
  const refresh_token = await generateToken({
    payload: { sub: user._id },
    options: {
      issuer,
      ...options,
      audience: [user.role],
      expiresIn: REFRESH_TOKEN_EXPIRESIN,
      jwtid,
    },
    secretKey: refreshSignature,
  });

  console.log({ accessSignature, refreshSignature });

  return { access_token, refresh_token };
};

export const createRevoketoken = async ({payload}) => {
  const consumedTime = Math.ceil(Date.now() / 1000) - payload.iat;
  const refreshExpiresIn = payload.iat + REFRESH_TOKEN_EXPIRESIN;
  const ttl = refreshExpiresIn - consumedTime;
  console.log({ payload, consumedTime, refreshExpiresIn, ttl });
  await set({
    key: userRevokeToken({ userId: payload.sub, jti: payload.jti }),
    value: payload.jti,
    ttl,
  });
  return;
};
