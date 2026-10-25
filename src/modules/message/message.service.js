
import { countDocuments, create, deleteMany, deleteOne, find, findById, findOne, paginate } from './../../common/repository/db.repository.js';
import { MessageModel  } from './../../DB/model/message.model.js';
import { UserModel  } from './../../DB/model/user.model.js';
import { IdentityRequestModel } from './../../DB/model/identityRequest.model.js';
import { RequestStatusEnum } from './../../common/enum/request.enum.js';
import { NotFoundException } from '../../common/exceptions/error.exception.js';


// The receiver must not learn who sent a message, unless the sender accepted
// an identity request for it. Messages I sent myself are returned untouched.
const presentMessages = async (docs, user) => {
    const me = String(user._id)
    const list = docs.map(doc => doc.toObject ? doc.toObject() : { ...doc })
    const received = list.filter(m => String(m.receiverId) === me && m.senderId && String(m.senderId) !== me)

    const requests = received.length ? await find({
        model: IdentityRequestModel,
        filter: { messageId: { $in: received.map(m => m._id) }, receiverId: user._id },
        options: { lean: true }
    }) : []
    const statusByMessage = new Map(requests.map(r => [String(r.messageId), r]))

    const acceptedSenderIds = [...new Set(requests
        .filter(r => r.status === RequestStatusEnum.ACCEPTED)
        .map(r => String(r.senderId)))]
    const senders = acceptedSenderIds.length ? await find({
        model: UserModel,
        filter: { _id: { $in: acceptedSenderIds } },
        options: { lean: true }
    }) : []
    const senderById = new Map(senders.map(u => [String(u._id), u]))

    return list.map(m => {
        if (!received.includes(m)) return m
        const request = statusByMessage.get(String(m._id))
        const status = request?.status ?? null
        const out = { ...m, identityRequest: request ? { _id: request._id, status } : null }
        if (status === RequestStatusEnum.ACCEPTED) {
            const sender = senderById.get(String(m.senderId))
            out.sender = sender ? { _id: sender._id, firstName: sender.firstName, lastName: sender.lastName, image: sender.image } : undefined
        } else {
            delete out.senderId
        }
        return out
    })
}

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
   data.docs = await presentMessages(data.docs, user)
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
     await deleteMany({
        model: IdentityRequestModel,
        filter: { messageId, status: { $ne: RequestStatusEnum.ACCEPTED } }
    })
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
    const [message] = await presentMessages([data], user)
    return message
}
