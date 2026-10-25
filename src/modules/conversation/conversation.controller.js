import { Router } from "express";
import { successResponse } from "../../common/utils/success.response.js";
import { authentication } from "../../middleware/authentication.middleware.js";
import { validation } from "../../middleware/validation.middleware.js";
import * as validators from "./conversation.validation.js";
import {
  getConversationMessages,
  getConversations,
  sendConversationMessage,
} from "./conversation.service.js";

const router = Router();

router.get("/", authentication(), validation(validators.getConversations), async (req, res, next) => {
  const data = await getConversations(req.validate.query, req.user);
  return successResponse({ res, data });
});

router.get("/:conversationId/messages", authentication(), validation(validators.getConversationMessages), async (req, res, next) => {
  const data = await getConversationMessages(req.validate.params, req.validate.query, req.user);
  return successResponse({ res, data });
});

router.post("/:conversationId/messages", authentication(), validation(validators.sendConversationMessage), async (req, res, next) => {
  const data = await sendConversationMessage(req.validate.params, req.validate.body, req.user);
  return successResponse({ res, data, status: 201 });
});

export default router;