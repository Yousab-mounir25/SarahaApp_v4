import { z } from "zod";
import { generalValidationFields } from "../../common/validation.js";
import { RequestStatusEnum } from "../../common/enum/request.enum.js";

const pageFields = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
};

export const createRequest = (lang) => {
  return z.object({
    body: z.strictObject({
      messageId: generalValidationFields.id(lang),
    }),
  });
};

export const getRequests = (lang) => {
  return z.object({
    query: z.strictObject({
      // incoming = requests asking ME (as the sender) to reveal myself
      // outgoing = requests I made (as the receiver) about messages I got
      type: z.enum(["incoming", "outgoing"]).default("incoming"),
      status: z.enum(Object.values(RequestStatusEnum)).optional(),
      ...pageFields,
    }),
  });
};

export const respondToRequest = (lang) => {
  return z.object({
    params: z.strictObject({
      requestId: generalValidationFields.id(lang),
    }),
    body: z.strictObject({
      status: z.enum([RequestStatusEnum.ACCEPTED, RequestStatusEnum.REJECTED]),
    }),
  });
};