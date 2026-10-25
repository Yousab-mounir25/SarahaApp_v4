import mongoose from "mongoose";

// Created when a sender accepts an identity request.
// It is linked to the original anonymous message and to the request.
const conversationSchema = new mongoose.Schema(
  {
    messageId: {
      type: mongoose.Types.ObjectId,
      ref: "Message",
      required: true,
      unique: true, // one conversation per message
    },
    requestId: {
      type: mongoose.Types.ObjectId,
      ref: "IdentityRequest",
      required: true,
    },
    senderId: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    receiverId: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    lastMessageAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    optimisticConcurrency: true,
  },
);

conversationSchema.index({ senderId: 1, lastMessageAt: -1 });
conversationSchema.index({ receiverId: 1, lastMessageAt: -1 });

export const ConversationModel =
  mongoose.models.Conversation ||
  mongoose.model("Conversation", conversationSchema);