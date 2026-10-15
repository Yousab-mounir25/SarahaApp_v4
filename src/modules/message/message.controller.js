import { Router } from "express";
import { successResponse } from './../../common/utils/success.response.js';
import { createMessage, deleteMessage, getAllMessages, getMessageById } from "./message.service.js";
import { uploadMiddleware } from './../../middleware/multer.middleware.js';
import { fileValidation, localFileUpload } from "../../common/utils/multer/local.multer.js";
import * as validators from './message.validation.js'
import { validation } from './../../middleware/validation.middleware.js';
import { authentication } from './../../middleware/authentication.middleware.js';
import { decodeToken } from "../../common/security/token.security.js";
const router = Router()


router.post('/' ,
    async(req,res,next)=>{
        if(req.headers['authorization']){
            const [key , token] = req.headers['authorization'].split(" ") || []
            const {user , payload} = await decodeToken({authorization:token} )
            req.user = user,
            req.payload=payload
        }
        next()
    },
    uploadMiddleware({
        multerMiddleware:localFileUpload().array("attachments" , 3),
        validation: fileValidation.image,
        isRequired:false,
        customPath:"messages"
    }),
    validation(validators.createMessage),
     async(req,res,next)=>{
        console.log(req.files);
        
    const data = await createMessage(req.body , req.files ,req.user)
    return successResponse({res , data , status:201})
})



router.get('/' , authentication() , validation(validators.getAllMessages) , async(req,res,next)=>{
    const data = await getAllMessages(req.validate.query , req.user)
    return successResponse({res, data})
})


    router.get('/:messageId' , authentication() , validation(validators.deleteMessage) , async(req,res,next)=>{
    const data = await getMessageById(req.validate.params , req.user)
    return successResponse({res, data})
})
router.delete('/:messageId' , authentication() , validation(validators.deleteMessage) , async(req,res,next)=>{
    const data = await deleteMessage(req.validate.params , req.user)
    return successResponse({res, data})
})




export default router 