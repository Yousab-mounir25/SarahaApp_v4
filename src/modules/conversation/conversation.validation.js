import { z } from "zod";
import { generalValidationFields } from "../../common/validation.js";

const pageFields = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
};

export const getConversations = (lang) => {
  return z.object({
    query: z.strictObject({ ...pageFields }),
  });
};

export const getConversationMessages = (lang) => {
  return z.object({
    params: z.strictObject({
      conversationId: generalValidationFields.id(lang),
    }),
    query: z.strictObject({ ...pageFields }),
  });
};

export const sendConversationMessage = (lang) => {
  return z.object({
    params: z.strictObject({
      conversationId: generalValidationFields.id(lang),
    }),
    body: z.strictObject({
      content: z.string().trim().min(1).max(5000),
    }),
  });
};