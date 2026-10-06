import { LanguageEnum } from "../common/enum/security.enum.js";
import { BadException } from "../common/exceptions/error.exception.js";

export const validation = (schema) => {
  return (req, res, next) => {

    const lang= Number(req.headers['accept-language'] ?? LanguageEnum.EN)
    console.log({lang})
    const validationResult = schema(lang).safeParse({
      body:req.body,
      query:req.query,
      params:req.params
    });
    console.log({v:validationResult.data});
    
    
    if (!validationResult.success) {
      throw BadException("Validation Error", validationResult.error.issues);
    }
    req.validate = validationResult.data    
    next()
  };
};
