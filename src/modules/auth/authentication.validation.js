import { email, z } from "zod";
import { GenderEnum, RoleEnum } from "../../common/enum/user.enum.js";
import { generalValidationFields } from "../../common/validation.js";

export const loginSchema = (lang) => {
  return z.strictObject({
    email: generalValidationFields.email(lang),
    password: generalValidationFields.password(lang),
  });
};

export const login = (lang) => {
  return z.object({
    body: loginSchema(lang), 
    query: z.strictObject({
      lang: z.enum(["ar", "en"]).default("ar"),
      // darkMood:z.coerce.boolean() ///type coercion
      darkMood: z.stringbool({
        truthy: ["true", "True", "1"],
        falsy: ["false", "False", "0"],
      }),
    }),
  });
};

export const signup = (lang) => {
  return z.object({
    body: loginSchema(lang)
      .safeExtend({
        username: generalValidationFields.username(lang),
        phone: generalValidationFields.phone(lang),
        confirmPassword: generalValidationFields.confirmPassword(lang),
        confirmEmail: generalValidationFields.email(lang),
        role: z.enum(RoleEnum),
        gender: generalValidationFields.gender(lang),
      })
      .superRefine((data, ctx) => {
        generalValidationFields.matchFields({
          original: "password",
          copy: "confirmPassword",
          data,
          ctx,
          lang
        });
        generalValidationFields.matchFields({
          original: "email",
          copy: "confirmEmail",
          data,
          ctx,
          lang
        });

        if (data.username.includes("admin")) {
          ctx.addIssue({
            code: "custom",
            path: ["username"],
            message: "UserName cannot be contain admin",
          });
        }
      }),
  });
};

export const confirmEmail = (lang)=>{
  return z.object({
    body:z.strictObject({
      email:generalValidationFields.email(lang),
      otp:generalValidationFields.otp(lang)
    })
  })
}
export const resendConfirmEmail = (lang)=>{
  return z.object({
    body:z.strictObject({
      email:generalValidationFields.email(lang)
    })
  })
}
export const resetForgotPassword = (lang)=>{
  return z.object({
    body:z.strictObject({
      email:generalValidationFields.email(lang),
      otp:generalValidationFields.otp(lang),
      password: generalValidationFields.password(lang),
      confirmPassword: generalValidationFields.confirmPassword(lang),
    }).superRefine((data, ctx) => {
      generalValidationFields.matchFields({
        original: "password",
        copy: "confirmPassword",
        data,
        ctx,
        lang
      });
    })
  })
}



// .refine((data)=>{
//     console.log({data});
//     return data.password == data.confirmPassword
// },{message:"password miss match with confirmation password"})
