import mongoose from "mongoose";
import { RequestStatusEnum } from "./../../common/enum/request.enum.js";

// The receiver of an anonymous message asks the sender to reveal who they are.
// receiverId = the user asking (the receiver of the message)
// senderId   = the user who decides (the sender of the message)
const identityRequestSchema = new mongoose.Schema(
  {
    messageId: {
      type: mongoose.Types.ObjectId,
      ref: "Message",
      required: true,
      unique: true, // one request per message
    },
    receiverId: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    senderId: { type: mongoose.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: Object.values(RequestStatusEnum),
      default: RequestStatusEnum.PENDING,
    },
    respondedAt: Date,
  },
  {
    timestamps: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    optimisticConcurrency: true,
  },
);

identityRequestSchema.index({ senderId: 1, status: 1, createdAt: -1 });
identityRequestSchema.index({ receiverId: 1, status: 1, createdAt: -1 });

export const IdentityRequestModel =
  mongoose.models.IdentityRequest ||
  mongoose.model("IdentityRequest", identityRequestSchema);