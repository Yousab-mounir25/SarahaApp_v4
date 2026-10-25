import express from 'express'
import { authenticationController  ,userController , messageController , requestController , conversationController } from './modules/index.js'
import { globalErrorHandling } from './middleware/index.js'
import { APP_EMAIL, APP_PASSWORD, ORIGINS, PORT } from './config.js'
import { bootstrapDB } from './DB/connection.db.js'
import {resolve} from 'node:path'
import cors from 'cors'
import { set } from './common/services/index.js'
import { createOtp } from './common/utils/otp.js'
import { stat } from 'node:fs'
import helmet from 'helmet'
import axios from 'axios'
import morgan from 'morgan'
import { generateLimiter } from './common/utils/limiter.js'
const app =express()
const port = PORT
app.use('/assets'  , express.static('./assets'))
await bootstrapDB(app,port)
app.set("trust proxy" , true)
// var corsOptions = {
//   origin: function (origin, callback) {
//     if(!ORIGINS.includes(origin)){
//         callback(new Error("invalid cors origins" , {cause:{status:401}}))
//     }
//     callback(null , ORIGINS)
//   }
// }


//if we want to block postman from send requests--> because the cors origin from it is --->undefined 

// const limiter = await generateLimiter({limit:10})
const limiter = await generateLimiter({limit:300})

app.use(  helmet(), cors() , morgan("dev"), limiter ,express.json())


app.get('/' , (req,res,next)=>{
    return res.status(200).json({message:"Hello world"})
})

app.use('/auth' , authenticationController)
app.use('/user' , userController)
app.use('/message' , messageController)
app.use('/request' , requestController)
app.use('/conversation' , conversationController)
app.all('{/*dummy}' , (req,res,next)=>{
    return res.status(404).json({message:"invalid ROuting"})
})
app.use(globalErrorHandling)
// app.listen(port , ()=>{
//     console.log(`app is running on port ${port}`);
    
// })