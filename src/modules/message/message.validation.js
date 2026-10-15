import { file, z } from "zod";
import { maxLength } from "zod";
import { generalValidationFields } from "../../common/validation.js";

export const createMessage = (lang) => {
  return z
    .object({
      body: z.strictObject({
        content: z.string().min(2).max(50000).optional(),
        receiverId: generalValidationFields.id(lang),
      }),
      files: z.array(generalValidationFields.file(lang)).max(3).optional(),
    })
    .superRefine((data, ctx) => {
      if (!data.body.content && !data.files?.length) {
        ctx.addIssue({
          code: "custom",
          path: ["content"],
          message: "Missing message content or files",
        });
      }
    });
};


export const getAllMessages = (lang) => {
  return z.object({
    query: z.strictObject({
        type: z.enum(["sent", "received" , "both"]).default("received").optional(),
        page:z.coerce.number().default(1),
        limit:z.coerce.number().default(5),
    })
  });
};
export const deleteMessage = (lang) => {
  return z.object({
    params: z.strictObject({
        messageId: generalValidationFields.id(lang)
    })
  });
};
