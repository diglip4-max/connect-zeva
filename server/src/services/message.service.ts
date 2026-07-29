// src/services/message.service.ts
import { Message } from "../models/Message.model";
import { Conversation } from "../models/Conversation.model";
import { AppError } from "../utils/AppError";
import { findOrCreateDirectConversation } from "./conversation.service";
import { getIO } from "../sockets";
import { IUser } from "../models/User.model";
import { sendPushToUsers } from "./push.service";
import logger from "../utils/logger";
import { extractUrls } from "../utils/linkify";

const DEFAULT_PAGE_SIZE = 30;

export async function getConversationMessages(
  conversationId: string,
  userId: string,
  cursor?: string, // pehle se load hue sabse purane message ka _id (pagination ke liye)
  limit: number = DEFAULT_PAGE_SIZE,
) {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    throw new AppError("Conversation not found", 404);
  }
  if (!conversation.members.some((m) => m.toString() === userId)) {
    throw new AppError("Not a member of this conversation", 403);
  }

  const query: any = { conversationId, isDeleted: { $ne: true } };
  if (cursor) {
    query._id = { $lt: cursor }; // cursor se purane messages (older-than-cursor)
  }

  const messages = await Message.find(query)
    .populate(
      "senderId",
      "name avatarUrl role zevaUserId clinicId isOnline lastSeenAt",
    )
    .sort({ createdAt: -1 }) // latest pehle laate hain query me, phir reverse karenge
    .limit(limit)
    .lean();

  return messages.reverse(); // frontend ko chronological order (oldest -> newest) chahiye
}

export async function markMessagesAsRead(
  conversationId: string,
  userId: string,
) {
  await Message.updateMany(
    {
      conversationId,
      senderId: { $ne: userId },
      readBy: { $ne: userId },
    },
    {
      $addToSet: { readBy: userId },
      $set: { status: "read" },
    },
  );
}

export async function sendMessage(input: {
  senderId: string;
  clinicId: string;
  conversationId?: string;
  recipientId?: string;
  text?: string;
  attachments?: any[];
  replyTo?: string;
}) {
  const {
    senderId,
    clinicId,
    conversationId,
    recipientId,
    text,
    attachments,
    replyTo,
  } = input;

  if (!text?.trim() && (!attachments || attachments.length === 0)) {
    throw new AppError("Message must have text or attachments", 400);
  }
  const links = input.text ? extractUrls(input.text) : [];

  let conversation;
  let isNewConversation = false;

  if (conversationId) {
    conversation = await Conversation.findById(conversationId);
    if (!conversation) throw new AppError("Conversation not found", 404);
  } else if (recipientId) {
    conversation = await findOrCreateDirectConversation(
      senderId,
      recipientId,
      clinicId,
    );
    isNewConversation = true;
  } else {
    throw new AppError("conversationId or recipientId is required", 400);
  }

  if (!conversation.members.some((m) => m.toString() === senderId)) {
    throw new AppError("Not a member of this conversation", 403);
  }
  if (conversation.clinicId !== clinicId) {
    throw new AppError("Cross-clinic access denied", 403);
  }

  const message = await Message.create({
    conversationId: conversation._id,
    senderId,
    clinicId,
    text: text?.trim(),
    links,
    attachments: attachments || [],
    replyTo,
    status: "sent",
  });

  conversation.lastMessage = message._id;
  conversation.lastMessageAt = new Date();
  await conversation.save();

  // generic populate() se TypeScript ko batao ki senderId ab poora IUser document hai,
  // sirf ObjectId nahi - isse aage .name, .avatarUrl, etc access karne pe type error nahi aayega
  const populatedMessage = await message.populate<{ senderId: IUser }>(
    "senderId",
    "name avatarUrl role zevaUserId clinicId isOnline lastSeenAt",
  );

  const senderUser = {
    _id: populatedMessage.senderId._id.toString(),
    name: populatedMessage.senderId.name,
    avatarUrl: populatedMessage.senderId.avatarUrl || "",
    role: populatedMessage.senderId.role || "",
    zevaUserId: populatedMessage.senderId.zevaUserId || "",
    clinicId: populatedMessage.senderId.clinicId,
    isOnline: populatedMessage.senderId.isOnline,
    lastSeenAt: populatedMessage.senderId.lastSeenAt,
  };

  const io = getIO();
  if (io) {
    io.to(`conversation:${conversation._id}`).emit("message:new", {
      _id: message._id.toString(),
      conversationId: conversation._id.toString(),
      senderId: senderUser,
      text: message.text,
      attachments: message.attachments,
      status: message.status,
      replyTo: message.replyTo?.toString(),
      createdAt: message.createdAt.toISOString(),
    });
  }

  // Push notification trigger karo - sirf sender ke alawa baaki members ko
  const recipientIds = conversation.members
    .map((m) => m.toString())
    .filter((id) => id !== senderId);

  const notificationTitle =
    conversation.type === "group"
      ? conversation.groupName || "Group message"
      : senderUser.name;

  const notificationBody =
    conversation.type === "group"
      ? `${senderUser.name}: ${message.text || "Sent an attachment"}`
      : message.text || "Sent an attachment";

  // fire-and-forget - message response ka wait nahi karna iske liye
  sendPushToUsers(recipientIds, {
    title: notificationTitle,
    body: notificationBody,
    conversationId: conversation._id.toString(),
    icon: "https://cdn-icons-png.flaticon.com/512/2462/2462719.png",
    senderName: senderUser.name,
  }).catch((err) => logger.warn({ err }, "Push notification batch failed"));

  return { message, conversation, isNewConversation };
}

export async function getSharedLinks(conversationId: string, userId: string) {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw new AppError("Conversation not found", 404);
  if (!conversation.members.some((m) => m.toString() === userId)) {
    throw new AppError("Not a member of this conversation", 403);
  }

  const messagesWithLinks = await Message.find({
    conversationId,
    links: { $exists: true, $ne: [] },
    isDeleted: { $ne: true },
  })
    .select("links createdAt senderId")
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  // yahan flatten karo - har message ke andar ke saare links ko
  // alag-alag flat entries me todo, taaki frontend ko simple {url, createdAt, senderId} mile
  const flattenedLinks = messagesWithLinks.flatMap((msg) =>
    msg.links.map((url) => ({
      url,
      createdAt: msg.createdAt,
      senderId: msg.senderId.toString(),
    })),
  );

  return flattenedLinks;
}

// src/services/message.service.ts (add these)

const EDIT_WINDOW_MS = 15 * 60 * 1000; // 15 min tak edit allowed

export async function toggleReaction(
  messageId: string,
  userId: string,
  emoji: string,
) {
  const message = await Message.findById(messageId);
  if (!message) throw new AppError("Message not found", 404);

  const existingIndex = message.reactions.findIndex(
    (r) => r.userId.toString() === userId && r.emoji === emoji,
  );

  if (existingIndex > -1) {
    // same emoji dobara click -> reaction remove (toggle off)
    message.reactions.splice(existingIndex, 1);
  } else {
    // user ka pehला-se koi reaction ho toh replace karo (ek user, ek emoji per message)
    message.reactions = message.reactions.filter(
      (r) => r.userId.toString() !== userId,
    );
    message.reactions.push({ userId: userId as any, emoji });
  }

  await message.save();
  return message;
}

export async function editMessage(
  messageId: string,
  userId: string,
  newText: string,
) {
  const message = await Message.findById(messageId);
  if (!message) throw new AppError("Message not found", 404);

  if (message.senderId.toString() !== userId) {
    throw new AppError("You can only edit your own messages", 403);
  }
  if (message.isDeleted) {
    throw new AppError("Cannot edit a deleted message", 400);
  }

  const messageAge = Date.now() - message.createdAt.getTime();
  if (messageAge > EDIT_WINDOW_MS) {
    throw new AppError("Edit window has expired (15 minutes)", 400);
  }

  message.text = newText.trim();
  message.links = extractUrls(newText);
  message.isEdited = true;
  await message.save();

  return message;
}

export async function deleteMessage(
  messageId: string,
  userId: string,
  deleteForEveryone: boolean,
) {
  const message = await Message.findById(messageId);
  if (!message) throw new AppError("Message not found", 404);

  if (deleteForEveryone) {
    if (message.senderId.toString() !== userId) {
      throw new AppError(
        "You can only delete your own messages for everyone",
        403,
      );
    }
    message.isDeleted = true;
    message.deletedForEveryone = true;
    message.text = undefined;
    message.attachments = [];
  } else {
    // "delete for me" - abhi ke schema me per-user hide nahi hai,
    // simplest MVP approach: sirf sender ke liye bhi global soft-delete
    // (agar future me per-user delete chahiye, alag "deletedFor: userId[]" field banana padega)
    if (message.senderId.toString() !== userId) {
      throw new AppError("You can only delete your own messages", 403);
    }
    message.isDeleted = true;
    message.text = undefined;
    message.attachments = [];
  }

  await message.save();
  return message;
}

export async function forwardMessage(
  originalMessageId: string,
  senderId: string,
  clinicId: string,
  targetConversationIds: string[],
) {
  const originalMessage = await Message.findById(originalMessageId);
  if (!originalMessage || originalMessage.isDeleted) {
    throw new AppError("Message not found or has been deleted", 404);
  }

  const forwardedMessages = [];

  for (const conversationId of targetConversationIds) {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) continue;
    if (!conversation.members.some((m) => m.toString() === senderId)) continue;

    const newMessage = await Message.create({
      conversationId: conversation._id,
      senderId,
      clinicId,
      text: originalMessage.text,
      links: originalMessage.links,
      attachments: originalMessage.attachments,
      forwardedFrom: originalMessage._id,
      status: "sent",
    });

    conversation.lastMessage = newMessage._id;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    const populated = await newMessage.populate<{ senderId: IUser }>(
      "senderId",
      "name avatarUrl role zevaUserId clinicId isOnline lastSeenAt",
    );

    const io = getIO();
    if (io) {
      io.to(`conversation:${conversation._id}`).emit("message:new", {
        _id: newMessage._id.toString(),
        conversationId: conversation._id.toString(),
        senderId: {
          _id: populated.senderId._id.toString(),
          name: populated.senderId.name,
          avatarUrl: populated.senderId.avatarUrl || "",
          role: populated.senderId.role,
          zevaUserId: populated.senderId.zevaUserId,
          clinicId: populated.senderId.clinicId,
          isOnline: populated.senderId.isOnline,
          lastSeenAt: populated.senderId.lastSeenAt,
        },
        text: newMessage.text,
        attachments: newMessage.attachments,
        status: newMessage.status,
        forwardedFrom: originalMessageId,
        createdAt: newMessage.createdAt.toISOString(),
      });
    }

    forwardedMessages.push(newMessage);
  }

  return forwardedMessages;
}

// mentions extract karne ka helper - message text me @name pattern dhoondta hai
export function extractMentionCandidates(text: string): string[] {
  const mentionPattern = /@(\w+(?:\s\w+)?)/g;
  const matches = [...text.matchAll(mentionPattern)];
  return matches.map((m) => m[1]);
}

export async function togglePinMessage(
  messageId: string,
  userId: string,
  clinicId: string,
) {
  const message = await Message.findById(messageId);
  if (!message) throw new AppError("Message not found", 404);

  const conversation = await Conversation.findById(message.conversationId);
  if (!conversation) throw new AppError("Conversation not found", 404);

  if (
    conversation.type === "group" &&
    !conversation?.admins?.some((a) => a.toString() === userId)
  ) {
    throw new AppError("Only admins can pin messages", 403);
  }

  if (message.isPinned) {
    message.isPinned = false;
    message.pinnedBy = undefined;
    message.pinnedAt = undefined;
  } else {
    message.isPinned = true;
    message.pinnedBy = userId as any;
    message.pinnedAt = new Date();
  }

  await message.save();
  return message;
}

export async function getPinnedMessages(
  conversationId: string,
  userId: string,
) {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw new AppError("Conversation not found", 404);
  if (!conversation.members.some((m) => m.toString() === userId)) {
    throw new AppError("Not a member of this conversation", 403);
  }

  return Message.find({
    conversationId,
    isPinned: true,
    isDeleted: { $ne: true },
  })
    .populate("senderId", "name avatarUrl")
    .sort({ pinnedAt: -1 })
    .lean();
}

export async function searchMessages(
  userId: string,
  clinicId: string,
  query: string,
) {
  // sirf un conversations me search karo jinka user member hai
  const userConversations = await Conversation.find({ members: userId }).select(
    "_id",
  );
  const conversationIds = userConversations.map((c) => c._id);

  return (
    Message.find({
      conversationId: { $in: conversationIds },
      text: { $regex: query, $options: "i" },
      isDeleted: { $ne: true },
    })
      .populate("senderId", "name avatarUrl")
      .populate("conversationId", "type groupName members")
      // .sort({ score: { $meta: "textScore" } })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean()
  );
}

// src/services/message.service.ts (add these)
export async function getSharedMedia(conversationId: string, userId: string) {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw new AppError("Conversation not found", 404);
  if (!conversation.members.some((m) => m.toString() === userId)) {
    throw new AppError("Not a member of this conversation", 403);
  }

  const messages = await Message.find({
    conversationId,
    "attachments.type": { $in: ["image", "video"] },
    isDeleted: { $ne: true },
  })
    .select("attachments createdAt senderId")
    .sort({ createdAt: -1 })
    .limit(60)
    .lean();

  // flatten karo - sirf image/video attachments
  return messages.flatMap((msg) =>
    msg.attachments
      .filter((a) => a.type === "image" || a.type === "video")
      .map((a) => ({ ...a, createdAt: msg.createdAt, messageId: msg._id })),
  );
}

export async function getSharedFiles(conversationId: string, userId: string) {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw new AppError("Conversation not found", 404);
  if (!conversation.members.some((m) => m.toString() === userId)) {
    throw new AppError("Not a member of this conversation", 403);
  }

  const messages = await Message.find({
    conversationId,
    "attachments.type": { $in: ["document", "file", "audio"] },
    isDeleted: { $ne: true },
  })
    .select("attachments createdAt senderId")
    .sort({ createdAt: -1 })
    .limit(60)
    .lean();

  return messages.flatMap((msg) =>
    msg.attachments
      .filter(
        (a) => a.type === "document" || a.type === "file" || a.type === "audio",
      )
      .map((a) => ({ ...a, createdAt: msg.createdAt, messageId: msg._id })),
  );
}
