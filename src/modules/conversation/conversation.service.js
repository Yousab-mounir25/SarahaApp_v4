import {
  ForbiddenException,
  NotFoundException,
} from "../../common/exceptions/error.exception.js";
import {
  create,
  findById,
  paginate,
  updateOne,
} from "../../common/repository/db.repository.js";
import { ConversationModel } from "../../DB/model/conversation.model.js";
import { ConversationMessageModel } from "../../DB/model/conversationMessage.model.js";

// Only the two users of the conversation may touch it.
const getParticipantConversation = async (conversationId, user) => {
  const conversation = await findById({
    model: ConversationModel,
    id: conversationId,
  });
  if (!conversation) {
    throw NotFoundException("Invalid conversation ID");
  }
  const me = String(user._id);
  if (String(conversation.senderId) !== me && String(conversation.receiverId) !== me) {
    throw ForbiddenException("You are not part of this conversation");
  }
  return conversation;
};

export const getConversations = async ({ page, limit }, user) => {
  return await paginate({
    model: ConversationModel,
    filter: { $or: [{ senderId: user._id }, { receiverId: user._id }] },
    options: {
      sort: { lastMessageAt: -1 },
      populate: [
        { path: "senderId", select: "firstName lastName image" },
        { path: "receiverId", select: "firstName lastName image" },
        { path: "messageId", select: "content attachments createdAt" },
      ],
    },
    page,
    limit,
  });
};

// 6) Send a message inside a conversation (both users can)
export const sendConversationMessage = async ({ conversationId }, { content }, user) => {
  const conversation = await getParticipantConversation(conversationId, user);
  const message = await create({
    model: ConversationMessageModel,
    data: { conversationId: conversation._id, senderId: user._id, content },
  });
  await updateOne({
    model: ConversationModel,
    filter: { _id: conversation._id },
    update: { $set: { lastMessageAt: message.createdAt } },
  });
  return message;
};

// 7) Get the messages of a conversation (newest first)
export const getConversationMessages = async ({ conversationId }, { page, limit }, user) => {
  const conversation = await getParticipantConversation(conversationId, user);
  const data = await paginate({
    model: ConversationMessageModel,
    filter: { conversationId: conversation._id },
    options: { sort: { createdAt: -1 } },
    page,
    limit,
  });
  return { conversation, ...data };
};