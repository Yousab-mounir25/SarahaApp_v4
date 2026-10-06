import { z } from "zod";
import { GenderEnum } from "./enum/user.enum.js";
import { LanguageEnum } from "./enum/security.enum.js";

export const matchFields = ({ original = "", copy, data, ctx, lang }) => {
  if (data[original] != data[copy]) {
    ctx.addIssue({
      code: "custom",
      path: [copy],
      message:
        lang == LanguageEnum.EN
          ? `Failed to match between ${original} and ${copy}`
          : `فشل في مطابقة بين ${original} و ${copy}`,
    });
  }
};

export const generalValidationFields = {
  email: (lang) =>
    z.email({
      message:
        lang == LanguageEnum.EN
          ? "invalid email format, please enter email like: any@any.com"
          : "عفوا تنسيق البريد الإلكتروني غير صحيح, يرجى ادخال البريد الإلكتروني مثل: any@any.com",
    }),
  password: (lang) =>
    z.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@!#$%^&*_-\|])(?=.*\s{0,}).{8,16}$/,{
      message:
        lang == LanguageEnum.EN
          ? "Password must contain at least one lowercase letter, one uppercase letter, one digit, one special character"
          : "كلمة المرور يجب أن تحتوي على حرف صغير واحد، حرف كبير واحد، رقم واحد، حرف خاص واحد، "
    })
      .min(8, {
        message:
          lang == LanguageEnum.EN
            ? "min length is 8 char"
            : " عفوا لا يمكن ادخال كلمة المرور اقل من 8 حروف",
      })
      .max(16, {
        message:
          lang == LanguageEnum.EN
            ? "max length is 16 char"
            : " عفوا لا يمكن ادخال كلمة المرور اكثر من 16 حرف",
      }),
  username: (lang) =>
    z
      .string()
      .min(2, {
        message:
          lang == LanguageEnum.EN
            ? "min length is 2 char"
            : " عفوا لا يمكن ادخال اسم المستخدم اقل من حرفين",
      })
      .max(50, {
        message:
          lang == LanguageEnum.EN
            ? "max length is 50 char"
            : " عفوا لا يمكن ادخال اسم المستخدم اكثر من 50 حرف",
      }),
  phone: (lang) =>
    z.e164({
      message:
        lang == LanguageEnum.EN
          ? "invalid phone number format, please enter phone like: +20123456789"
          : "عفوا رقم الهاتف غير صحيح, يرجى ادخال رقم الهاتف مثل: +20123456789",
    }),
  confirmPassword: (lang) =>
    z
      .string()
      .min(8, {
        message:
          lang == LanguageEnum.EN
            ? "min length is 8 char"
            : " عفوا لا يمكن ادخال كلمة المرور اقل من 8 حروف",
      })
      .max(16, {
        message:
          lang == LanguageEnum.EN
            ? "max length is 16 char"
            : " عفوا لا يمكن ادخال كلمة المرور اكثر من 16 حرف",
      }),
  gender: (lang) => z.enum(GenderEnum).optional(),
  otp:(lang)=>z.string().regex(/^\d{6}$/,{
    message:
      lang == LanguageEnum.EN
        ? "invalid otp format, please enter otp like: 123456"
        : "عفوا رمز التحقق غير صحيح, يرجى ادخال رمز التحقق مثل: 123456",
  }),
  matchFields,
};
