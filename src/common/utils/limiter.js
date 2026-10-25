 import {ipKeyGenerator, rateLimit} from 'express-rate-limit'
 import geoip from 'geoip-lite'
import { successResponse } from './success.response.js'
import { client } from '../../DB/redis.connection.js'
 
 
 function fromWhere(ip){
    try {
        return geoip.lookup(ip) // if the ip valid return an object with [range , country ,region , city,timezone , area]
    } catch (error) {
        console.log(error)
    }
}

export const generateLimiter = async({
    ttl=15,
    status=429,
    message="Too Many Requests",
    skipSuccessfulRequests,
    skipFailedRequests,
    legacyHeaders=true,
    standardHeaders="draft-8",
    limit=1000 //trials
    
})=>{
    return rateLimit({
    windowMs:ttl*60*1000, //how long should we remember the request
    // limit: function(req){
    //     const data =  fromWhere(req.ip)
    //     return ttl
    // },
    limit,
    skipSuccessfulRequests,
    legacyHeaders,
    standardHeaders,
    skipFailedRequests,
    handler:function(req,res,next){
        return successResponse({res,message , status})
    },
    //legacyHeaders:false 
    keyGenerator:function(req){
        const ip = ipKeyGenerator(req.ip , 52)
        return `${ip}::${req.path}`
    },
    store:{
        async incr(key,cb){
            //called by keyGenerator
            try {
                const count = await client.incr(key)
                if(count ==1){
                    await client.expire(key , ttl*60) //ttl
                }
                cb(null , count)
            } catch (error) {
                cb(error)
            }
        },
        //called by skipsuccessfullRequest:true
        async decrement(key){
            if(await client.exists(key)){
                await client.decr(key)
            }
        }
    }

})
}