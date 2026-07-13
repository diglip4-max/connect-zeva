// src/sockets/chat.socket.ts
import { Server, Socket } from "socket.io";
import { Conversation } from "../models/Conversation.model";
import { Message } from "../models/Message.model";
import logger from "../utils/logger";
import {
  ServerToClientEvents,
  ClientToServerEvents,
  SocketData,
  SendMessagePayload,
  ReadReceiptPayload,
} from "../types/socket.types";
import { AppError } from "../utils/AppError";

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;
type TypedSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  {},
  SocketData
>;

export function registerChatHandlers(io: TypedServer, socket: TypedSocket) {
  const currentUser = socket.data.user;

  // join a room per conversation the user belongs to (for scoped broadcast)
  joinUserConversationRooms(socket);

  socket.on("message:send", async (payload: SendMessagePayload) => {
    try {
      const conversation = await Conversation.findById(payload.conversationId);

      if (!conversation) {
        throw new AppError("Conversation not found", 404);
      }

      // security: sender must be a member of this conversation
      if (!conversation.members.some((m) => m.toString() === currentUser.id)) {
        throw new AppError("Not a member of this conversation", 403);
      }

      // security: conversation must belong to the same clinic
      if (conversation.clinicId !== currentUser.clinicId) {
        throw new AppError("Cross-clinic access denied", 403);
      }

      const message = await Message.create({
        conversationId: conversation._id,
        senderId: currentUser.id,
        clinicId: currentUser.clinicId,
        text: payload.text,
        attachments: payload.attachments || [],
        replyTo: payload.replyTo,
        status: "sent",
      });

      conversation.lastMessage = message._id;
      conversation.lastMessageAt = new Date();
      await conversation.save();

      // broadcast to everyone in the conversation room (including sender, for multi-device sync)
      io.to(`conversation:${conversation._id}`).emit("message:new", {
        _id: message._id.toString(),
        conversationId: conversation._id.toString(),
        senderId: currentUser.id,
        text: message.text,
        attachments: message.attachments,
        status: message.status,
        replyTo: message.replyTo?.toString(),
        createdAt: message.createdAt.toISOString(),
      });
    } catch (err) {
      logger.warn({ err, userId: currentUser.id }, "message:send failed");
      const errMessage =
        err instanceof AppError ? err.message : "Failed to send message";
      socket.emit("error", { context: "message:send", message: errMessage }); // ✅ fixed
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
      }); // ✅ fixed
    }
  });

  socket.on("typing:start", (payload) => {
    socket.to(`conversation:${payload.conversationId}`).emit("typing:start", {
      conversationId: payload.conversationId,
      userId: currentUser.id,
    });
  });

  socket.on("typing:stop", (payload) => {
    socket.to(`conversation:${payload.conversationId}`).emit("typing:stop", {
      conversationId: payload.conversationId,
      userId: currentUser.id,
    });
  });
}

// helper - user ke saare conversations ke socket rooms me join karwa do connect hote hi
async function joinUserConversationRooms(socket: TypedSocket) {
  const conversations = await Conversation.find({
    members: socket.data.user.id,
  }).select("_id");

  conversations.forEach((c) => {
    socket.join(`conversation:${c._id}`);
  });
}
