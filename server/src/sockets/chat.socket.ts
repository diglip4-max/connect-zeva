// src/sockets/chat.socket.ts
import { Server, Socket } from "socket.io";
import { Conversation } from "../models/Conversation.model";
import { Message } from "../models/Message.model";
import { findOrCreateDirectConversation } from "../services/conversation.service";
import logger from "../utils/logger";
import { AppError } from "../utils/AppError";
import {
  ServerToClientEvents,
  ClientToServerEvents,
  SocketData,
  SendMessagePayload,
  ReadReceiptPayload,
  TypingPayload,
} from "../types/socket.types";
import { sendMessage } from "@/services/message.service";

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;
type TypedSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  {},
  SocketData
>;

export function registerChatHandlers(io: TypedServer, socket: TypedSocket) {
  const currentUser = socket.data.user;

  joinUserConversationRooms(socket);

  // lekin frontend ko REST use karna chahiye reliability ke liye.
  socket.on("message:send", async (payload: SendMessagePayload) => {
    try {
      const { conversation, isNewConversation } = await sendMessage({
        senderId: currentUser.id,
        clinicId: currentUser.clinicId,
        conversationId: payload.conversationId,
        recipientId: payload.recipientId,
        text: payload.text,
        attachments: payload.attachments,
        replyTo: payload.replyTo,
      });

      if (isNewConversation) {
        socket.join(`conversation:${conversation._id}`);
      }
      // broadcast already sendMessage() ke andar ho chuka hai
    } catch (err) {
      logger.warn({ err, userId: currentUser.id }, "message:send failed");
      const errMessage =
        err instanceof AppError ? err.message : "Failed to send message";
      socket.emit("error", { context: "message:send", message: errMessage });
    }
  });

  socket.on("message:markRead", async (payload: ReadReceiptPayload) => {
    try {
      const message = await Message.findById(payload.messageId);
      if (!message) return;

      if (!message.readBy.some((id) => id.toString() === currentUser.id)) {
        message.readBy.push(currentUser.id as any);
        message.status = "read";
        await message.save();
      }

      io.to(`conversation:${payload.conversationId}`).emit("message:read", {
        conversationId: payload.conversationId,
        messageId: payload.messageId,
        userId: currentUser.id,
      });
    } catch (err) {
      logger.warn({ err }, "message:markRead failed");
      socket.emit("error", {
        context: "message:markRead",
        message: "Failed to mark message as read",
      });
    }
  });

  socket.on("typing:start", (payload: TypingPayload) => {
    logger.info({ payload }, "typing:start");

    if (!payload.conversationId) return;
    socket.to(`conversation:${payload.conversationId}`).emit("typing:start", {
      conversationId: payload.conversationId,
      userId: currentUser.id,
    });
  });

  socket.on("typing:stop", (payload: TypingPayload) => {
    if (!payload.conversationId) return;
    socket.to(`conversation:${payload.conversationId}`).emit("typing:stop", {
      conversationId: payload.conversationId,
      userId: currentUser.id,
    });
  });
}

async function joinUserConversationRooms(socket: TypedSocket) {
  const conversations = await Conversation.find({
    members: socket.data.user.id,
  }).select("_id");

  conversations.forEach((c) => {
    socket.join(`conversation:${c._id}`);
  });
}
