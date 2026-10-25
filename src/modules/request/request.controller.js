import { Router } from "express";
import { successResponse } from "../../common/utils/success.response.js";
import { authentication } from "../../middleware/authentication.middleware.js";
import { validation } from "../../middleware/validation.middleware.js";
import * as validators from "./request.validation.js";
import { createRequest, getRequests, respondToRequest } from "./request.service.js";

const router = Router();

// receiver asks the sender of a message to reveal their identity
router.post("/", authentication(), validation(validators.createRequest), async (req, res, next) => {
  const data = await createRequest(req.validate.body, req.user);
  return successResponse({ res, data, status: 201 });
});

// ?type=incoming|outgoing&status=pending|accepted|rejected&page&limit
router.get("/", authentication(), validation(validators.getRequests), async (req, res, next) => {
  const data = await getRequests(req.validate.query, req.user);
  return successResponse({ res, data });
});

// sender accepts or rejects: body { status: "accepted" | "rejected" }
router.patch("/:requestId", authentication(), validation(validators.respondToRequest), async (req, res, next) => {
  const data = await respondToRequest(req.validate.params, req.validate.body, req.user);
  return successResponse({ res, data });
});

export default router;