import { LogoutEnum } from "../../common/enum/security.enum.js";
import { ConflictException } from "../../common/exceptions/error.exception.js";
import {
  findById,
  findByIdAndUpdate,
} from "../../common/repository/db.repository.js";
import {
  createLoginCredentials,
  createRevoketoken,
  userBaseRevokeToken,
  verifyToken,
} from "../../common/security/token.security.js";
import { del, keys } from "../../common/services/cache.service.js";
import { ACCESS_TOKEN_EXPIRESIN } from "../../config.js";
import { UserModel } from "../../DB/model/user.model.js";
import jwt from "jsonwebtoken";

export const getProfile = async (user) => {
  return user;
};

export const updateProfile = async (user, inputs) => {
  const account = await findByIdAndUpdate({
    model: UserModel,
    id: user._id,
    update: inputs,
  });
  return account;
};

export const rotateToken = async (payload, user , issuer ) => {
  const accessExpiresIn = (payload.iat + ACCESS_TOKEN_EXPIRESIN) * 1000; //to ms
  const currentTime = Date.now() + 5 * 60000; //plus 5 mins in ms
  if (currentTime < accessExpiresIn) {
    throw ConflictException(
      "sorry we cannot create login credential, while current access token still within valid time range",
    );
  }

  const data=  await createLoginCredentials({ user,issuer });
  await createRevoketoken({payload})
  return data
};

export const logout = async (payload, user , {action=LogoutEnum.DEVICE}) => {
  switch (action) {
    case LogoutEnum.All:
      user.changeCredentialsTime=new Date()
      await user.save()
      await del({key:await keys({prefix:userBaseRevokeToken({userId:payload.sub})})})
      break;
    default:
       await createRevoketoken({payload})
      break;
  }
 return
};
 
