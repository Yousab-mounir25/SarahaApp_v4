import mongoose from "mongoose";

const conversationMessageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    senderId: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true, minLength: 1, maxLength: 5000 },
  },
  {
    timestamps: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    optimisticConcurrency: true,
  },
);

conversationMessageSchema.index({ conversationId: 1, createdAt: -1 });

export const ConversationMessageModel =
  mongoose.models.ConversationMessage ||
  mongoose.model("ConversationMessage", conversationMessageSchema);