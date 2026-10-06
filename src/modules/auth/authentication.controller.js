import { Router } from "express";
import {
  confirmEmail,
  login,
  requestForgotPasswordCode,
  resendConfirmEmail,
  resetForgotPassword,
  signup,
  signupWithGmail,
  verifyForgotPasswordCode,
} from "./authentication.service.js";
import { successResponse } from "../../common/utils/success.response.js";
import * as validators from "./authentication.validation.js";
import { validation } from "../../middleware/validation.middleware.js";
import { authentication } from "../../middleware/authentication.middleware.js";

const router = Router();

//add validation middleware
router.post(
  "/signup",
  validation(validators.signup),
  async (req, res, next) => {
    const user = await signup(req.validate.body);
    return successResponse({
      res,
      data: user,
      message: "User added successfully",
      status: 201,
    });
  },
);
router.post("/signup-with-gmail", async (req, res, next) => {
  const { status, data } = await signupWithGmail(
    req.body,
    `${req.protocol}://${req.host}`,
  );
  return successResponse({
    res,
    data,
    message: "User added successfully",
    status,
  });
});



//add validation middleware
router.post("/login", validation(validators.login), async (req, res, next) => {
  const user = await login(req.validate.body, `${req.protocol}://${req.host}`);
  return successResponse({ res, data: user });
});
router.patch("/confirm-email", validation(validators.confirmEmail), async (req, res, next) => {
  const user = await confirmEmail(req.body);
  return successResponse({ res, data: user });
});
router.patch("/resend-confirm-email", validation(validators.resendConfirmEmail), async (req, res, next) => {
  const user = await resendConfirmEmail(req.body);
  return successResponse({ res, data: user });
});
router.post("/verify-forgot-password", validation(validators.confirmEmail), async (req, res, next) => {
  const user = await verifyForgotPasswordCode(req.body);
  return successResponse({ res, data: user });
});
router.patch("/reset-forgot-password", validation(validators.resetForgotPassword), async (req, res, next) => {
  const user = await resetForgotPassword(req.body);
  return successResponse({ res, data: user });
});

router.post("/forget-password", validation(validators.resendConfirmEmail), async (req, res, next) => {
  const user = await requestForgotPasswordCode(req.body);
  return successResponse({ res, data: user ,status:201});
});
 


export default router;
