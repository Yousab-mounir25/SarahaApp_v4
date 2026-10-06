import { Router } from "express";
import { successResponse } from "../../common/utils/success.response.js";
import { getProfile, logout, rotateToken, updateProfile } from "./user.service.js";
import { authentication, authorization, uploadMiddleware } from "../../middleware/index.js";
import { TokenTypeEnum } from "../../common/enum/security.enum.js";
import { RoleEnum } from "../../common/enum/user.enum.js";
import { fileValidation, localFileUpload, processFile, processMulterUpload } from "../../common/utils/multer/local.multer.js";
const router  = Router()


//application level middleware to check the authorization before enter the service
router.get('/' , authentication() ,async (req,res,next)=>{
    const data = await getProfile(req.user)
    return successResponse({res,data:data})
})


router.patch('/' , authentication() , authorization([RoleEnum.ADMIN , RoleEnum.USER]) ,async (req,res,next)=>{
    const data = await updateProfile(req.user , req.body)
    return successResponse({res,data})
})

router.post("/logout", authentication(), async (req, res, next) => {
  console.log({ body: req.body });

  const data = await logout(req.payload, req.user , req.body);
  return successResponse({ res, data });
});


router.post('/rotate-token' , authentication(TokenTypeEnum.REFRESH) ,async (req,res,next)=>{
    const data = await rotateToken(req.payload, req.user , `${req.protocol}://${req.host}`)
    return successResponse({res,data})
})
// router.patch('/profile-image',
//     // authentication(),
//     localFileUpload({maxSize:1 , validation:fileValidation.image })
//     // .fields([{name:'attachment' , maxCount:2} , {name:'cover' , maxCount:2}]),
//     // .array('attachment'),
//     .single("attachment"),
//      processMulterUpload({customPath:"users",validation:fileValidation.image}),
//       async (req,res,next)=>{
//         req.user.image = req.file.finalPath
//         await req.user.save()
//     return successResponse({res,data:{user:req.user}})
// })
router.patch('/profile-image',
    authentication(),
        uploadMiddleware({
            multerMiddleware:localFileUpload({maxSize:2}).single("attachment"),
            customPath:"users",
            validation:fileValidation.image
        }),
      async (req,res,next)=>{
        req.user.image = req.file.finalPath
        await req.user.save()
    return successResponse({res,data:{file:req.file}})
})

export default router