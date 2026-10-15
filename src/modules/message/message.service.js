
import { NotFoundException } from '../../common/exceptions/error.exception.js';
import { countDocuments, create, deleteOne, find, findById, findOne, paginate } from './../../common/repository/db.repository.js';
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
export const getAllMessages =async ({type , limit , page},  user) => {
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


    
   const data = await paginate({
    model : MessageModel,
    filter , options:{sort:{createdAt:-1}},
    page,
    limit
   })
  
    return data


};

export const deleteMessage= async ({messageId},user)=>{
    const data = await deleteOne({
        model:MessageModel,
        filter:{
            receiverId:user._id,
            _id:messageId
        }
    });

    if(!data.deletedCount){
        throw NotFoundException('Invalid message ID')
    }
    return data
}
export const getMessageById= async ({messageId},user)=>{
    const data = await findOne({
        model:MessageModel,
        filter:{
            receiverId:user._id,
            _id:messageId
        }
    });

    if(!data){
        throw NotFoundException('Invalid message ID')
    }
    return data
}
