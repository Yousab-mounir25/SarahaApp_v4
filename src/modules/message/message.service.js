
import { NotFoundException } from '../../common/exceptions/error.exception.js';
import { create, find, findById } from './../../common/repository/db.repository.js';
import { MessageModel  } from './../../DB/model/message.model.js';
import { UserModel  } from './../../DB/model/user.model.js';
export const createMessage =async ({ content, receiverId } = {}, files = [] , user=undefined) => {

    const receiver = await findById({
        model:UserModel,
        id:{
            _id:receiverId
        }
    })
    if(!receiver){
        throw NotFoundException("Invalid receiver Id")
    }
    const message = await create({
        model:MessageModel,
        data:{
            content,
            receiverId,
            attachments:files.map(ele=> ele.path),
            ...(user?{senderId:user._id}:{})
        }
    })
    return message


};
export const getAllMessages =async ({type}={} , user) => {
    let filter = {}
    if(type === "sent"){
        filter = {senderId: user._id}
    }else if(type === "received"){
        filter = {receiverId: user._id}
    }else{
        filter = {$or:[
            {senderId: user._id},
            {receiverId: user._id}
        ]}
    }
    console.log({type , ...filter});
    
    const messages = await find({
        model:MessageModel,
        filter:{
            ...filter
        }
    })
    if(!messages){
        throw NotFoundException("No messages found")
    }
  
    return messages 


};
