import {
  BadException,
  ConflictException,
  NotFoundException,
} from "../../common/exceptions/error.exception.js";
import {
  create,
  findById,
  findOne,
  findOneAndUpdate,
  paginate,
} from "../../common/repository/db.repository.js";
import { RequestStatusEnum } from "../../common/enum/request.enum.js";
import { MessageModel } from "../../DB/model/message.model.js";
import { IdentityRequestModel } from "../../DB/model/identityRequest.model.js";
import { ConversationModel } from "../../DB/model/conversation.model.js";

const isDuplicateKey = (error) => error?.code === 11000;
// The requester must not learn who the sender is until the request is accepted.
const hideSender = (doc) => {
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  if (obj.status !== RequestStatusEnum.ACCEPTED) delete obj.senderId;
  return obj;
};

// 2) Request sender identity: the receiver of a message asks who sent it.
export const createRequest = async ({ messageId }, user) => {
  const message = await findOne({
    model: MessageModel,
    filter: { _id: messageId, receiverId: user._id },
  });
  if (!message) {
    throw NotFoundException("Invalid message ID");
  }
  if (!message.senderId) {
    throw ConflictException(
      "This message was sent without an account, so there is no sender to ask",
    );
  }
  if (String(message.senderId) === String(user._id)) {
    throw BadException("You sent this message to yourself");
  }

  const existing = await findOne({
    model: IdentityRequestModel,
    filter: { messageId },
  });
  if (existing) {
    throw ConflictException(
      `An identity request for this message already exists (${existing.status})`,
    );
  }

    try {
    const request = await create({
      model: IdentityRequestModel,
      data: {
        messageId,
        receiverId: user._id,
        senderId: message.senderId,
        status: RequestStatusEnum.PENDING,
      },
    });
    return hideSender(request);
  } catch (error) {
    if (isDuplicateKey(error)) {
      throw ConflictException(
        "An identity request for this message already exists",
      );
    }
    throw error;
  }
};

// 3) Get requests.
// incoming (default): requests received by the sender, waiting for a decision.
// outgoing: requests I made as a receiver (the sender stays hidden here).
export const getRequests = async ({ type, status, page, limit }, user) => {
  const incoming = type === "incoming";
  const filter = {
    ...(incoming ? { senderId: user._id } : { receiverId: user._id }),
    ...(status ? { status } : {}),
  };

  const data = await paginate({
    model: IdentityRequestModel,
    filter,
    options: {
      sort: { createdAt: -1 },
      populate: [
        { path: "messageId", select: "content attachments createdAt" },
        // the sender already knows who they wrote to; show who is asking
        ...(incoming
          ? [{ path: "receiverId", select: "firstName lastName image" }]
          : []),
      ],
    },
    page,
    limit,
  });
   if (!incoming) data.docs = data.docs.map(hideSender);
  return data;
};

// 4) Accept or reject a request (only the sender of the message can).
// 5) On accept, create a conversation linked to the original message.
export const respondToRequest = async ({ requestId }, { status }, user) => {
  const request = await findOne({
    model: IdentityRequestModel,
    filter: { _id: requestId, senderId: user._id },
  });
  if (!request) {
    throw NotFoundException("Invalid request ID");
  }
  if (request.status !== RequestStatusEnum.PENDING) {
    throw ConflictException(`This request was already ${request.status}`);
  }

  if (status === RequestStatusEnum.ACCEPTED) {
    const message = await findById({
      model: MessageModel,
      id: request.messageId,
      options: { lean: true },
    });
    if (!message) {
      throw NotFoundException("The message of this request no longer exists");
    }
  }

  // only one caller can move the request out of "pending"
  const updated = await findOneAndUpdate({
    model: IdentityRequestModel,
    filter: {
      _id: requestId,
      senderId: user._id,
      status: RequestStatusEnum.PENDING,
    },
    update: { $set: { status, respondedAt: new Date() } },
  });
  if (!updated) {
    throw ConflictException("This request was already answered");
  }

  if (status === RequestStatusEnum.REJECTED) {
    return { request: updated };
  }

  let conversation;
  try {
    conversation = await create({
      model: ConversationModel,
      data: {
        messageId: updated.messageId,
        requestId: updated._id,
        senderId: updated.senderId,
        receiverId: updated.receiverId,
      },
    });
  } catch (error) {
    if (!isDuplicateKey(error)) throw error;
    conversation = await findOne({
      model: ConversationModel,
      filter: { messageId: updated.messageId },
    });
  }
  return { request: updated, conversation };
};