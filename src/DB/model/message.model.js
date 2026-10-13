import mongoose from "mongoose";
import { GenderEnum, ProviderEnum, RoleEnum } from "./../../common/enum/user.enum.js";
import { maxLength, minLength, refine, string } from "zod";
import { tr } from "zod/locales";
const messageSchema = new mongoose.Schema(
  {
   content:{
    type:String,
    required:function(){
      return this.attachments?.length > 0 ? false :true
    },
    minLength:2,
    maxLength:50000
   },
   attachments:[String],
   senderId:{
    type:mongoose.Types.ObjectId , ref:"User" ,required:false
   },
   receiverId:{
    type:mongoose.Types.ObjectId , ref:"User" ,required:true
   }

  },
  {
    timestamps: true,
    // collection:lw 3ayez a3'ayar el esm
    strict: false,
    validateBeforeSave: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    optimisticConcurrency: true,
  },
);

export const MessageModel =mongoose.models.message || mongoose.model("Message", messageSchema);
