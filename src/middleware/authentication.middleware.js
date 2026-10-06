import { ForbiddenException, UnAuthorizedException } from "../common/exceptions/error.exception.js";
import { decodeToken } from "../common/security/token.security.js";
import { TokenTypeEnum } from "./../common/enum/index.js";

export const authentication = (tokenType = TokenTypeEnum.ACCESS) => {
  return async (req, res, next) => {
    const { authorization } = req.headers;
    if (!authorization) {
      throw UnAuthorizedException("Unauthorized account ");
    }
    //Bearer token
    const [key, token] = authorization.split(" ") ?? [];
    console.log({ key, token });

    switch (key) {
      // case "Basic":
      //   const [email,password] = Buffer.from(token, "base64").toString().split(":");
      //   // console.log({ email , password });
      //   break;
      case "Bearer":
        const { user, payload } = await decodeToken({authorization:token,tokenType});
        req.user = user
        req.payload = payload
        break;
      default:
        next(new Error("invalid authentication schema" ,{cause:{status:400}}))
        break;
    }
    next();
  };
};

//===================== AUTHORIZATION ============================

// export const authorization = (accessRole) => {
//   return async (req, res, next) => {
//     if (req.user.role < accessRole) {
//       throw ForbiddenException("Forbbiden account ");
//     }
//     next();
//   };
// };


//send an array to the function with the allowed roles to use a specific endpoint
export const authorization = (accessRoles) => {
  return async (req, res, next) => {
    if (!accessRoles.includes(req.user.role)) {
      throw ForbiddenException("Forbbiden account ");
    }
    next();
  };
};
