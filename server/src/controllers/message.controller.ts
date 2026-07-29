// src/controllers/message.controller.ts
import { Request, Response, NextFunction } from "express";
import {
  deleteMessage,
  editMessage,
  forwardMessage,
  getConversationMessages,
  getPinnedMessages,
  getSharedFiles,
  getSharedLinks,
  getSharedMedia,
  markMessagesAsRead,
  searchMessages,
  sendMessage,
  togglePinMessage,
  toggleReaction,
} from "../services/message.service";
import { successResponse } from "../utils/apiResponse";
import { getIO } from "../sockets";

export const getMessages = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { conversationId } = req.params as { conversationId: string };
    const { cursor, limit } = req.query;
    const { id: userId } = req.user!;

    const messages = await getConversationMessages(
      conversationId,
      userId,
      cursor as string | undefined,
      limit ? parseInt(limit as string, 10) : undefined,
    );

    return successResponse(res, 200, "Messages fetched", messages);
  } catch (err) {
    next(err);
  }
};

export const markAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { conversationId } = req.params as { conversationId: string };
    const { id: userId } = req.user!;

    await markMessagesAsRead(conversationId, userId);

    return successResponse(res, 200, "Messages marked as read");
  } catch (err) {
    next(err);
  }
};

export const postMessage = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { conversationId, recipientId, text, attachments, replyTo } =
      req.body;
    const { id: senderId, clinicId } = req.user!;

    const { message, conversation, isNewConversation } = await sendMessage({
      senderId,
      clinicId,
      conversationId,
      recipientId,
      text,
      attachments,
      replyTo,
    });

    // agar naya conversation bana (recipientId flow), sender ka socket us room me join karwao
    if (isNewConversation) {
      const io = getIO();
      const senderSockets = io?.sockets.sockets;
      senderSockets?.forEach((s) => {
        if (s.data.user?.id === senderId) {
          s.join(`conversation:${conversation._id}`);
        }
      });
    }

    return successResponse(res, 201, "Message sent", {
      message,
      conversationId: conversation._id,
    });
  } catch (err) {
    next(err);
  }
};

export const getLinks = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { conversationId } = req.params as { conversationId: string };
    const { id: userId } = req.user!;
    const links = await getSharedLinks(conversationId, userId);
    return successResponse(res, 200, "Links fetched", links);
  } catch (err) {
    next(err);
  }
};

export const reactToMessage = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { messageId } = req.params as { messageId: string };
    const { emoji } = req.body;
    const { id: userId } = req.user!;

    const message = await toggleReaction(messageId, userId, emoji);

    const io = getIO();
    if (io) {
      io.to(`conversation:${message.conversationId}`).emit("message:reaction", {
        messageId: message._id.toString(),
        reactions: message.reactions.map((r) => ({
          userId: r.userId.toString(),
          emoji: r.emoji,
        })),
      });
    }

    return successResponse(res, 200, "Reaction updated", message);
  } catch (err) {
    next(err);
  }
};

export const updateMessage = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { messageId } = req.params as { messageId: string };
    const { text } = req.body;
    const { id: userId } = req.user!;

    const message = await editMessage(messageId, userId, text);

    const io = getIO();
    if (io) {
      io.to(`conversation:${message.conversationId}`).emit("message:edited", {
        messageId: message._id.toString(),
        text: message.text,
        isEdited: true,
      });
    }

    return successResponse(res, 200, "Message updated", message);
  } catch (err) {
    next(err);
  }
};

export const removeMessage = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { messageId } = req.params as { messageId: string };
    const { forEveryone } = req.body;
    const { id: userId } = req.user!;

    const message = await deleteMessage(messageId, userId, !!forEveryone);

    const io = getIO();
    if (io) {
      io.to(`conversation:${message.conversationId}`).emit("message:deleted", {
        messageId: message._id.toString(),
        deletedForEveryone: message.deletedForEveryone,
      });
    }

    return successResponse(res, 200, "Message deleted", message);
  } catch (err) {
    next(err);
  }
};

export const forwardMessageController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { messageId } = req.params as { messageId: string };
    const { targetConversationIds } = req.body;
    const { id: senderId, clinicId } = req.user!;

    if (
      !Array.isArray(targetConversationIds) ||
      targetConversationIds.length === 0
    ) {
      return res
        .status(400)
        .json({ success: false, message: "targetConversationIds required" });
    }

    const messages = await forwardMessage(
      messageId,
      senderId,
      clinicId,
      targetConversationIds,
    );
    return successResponse(res, 200, "Message forwarded", messages);
  } catch (err) {
    next(err);
  }
};

// src/controllers/message.controller.ts (add these)
export const pinMessage = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { messageId } = req.params as { messageId: string };
    const { id: userId, clinicId } = req.user!;
    const message = await togglePinMessage(messageId, userId, clinicId);

    const io = getIO();
    if (io) {
      io.to(`conversation:${message.conversationId}`).emit("message:pinned", {
        messageId: message._id.toString(),
        isPinned: message.isPinned,
      });
    }

    return successResponse(res, 200, "Pin status updated", message);
  } catch (err) {
    next(err);
  }
};

export const getPinned = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { conversationId } = req.params as { conversationId: string };
    const { id: userId } = req.user!;
    const messages = await getPinnedMessages(conversationId, userId);
    return successResponse(res, 200, "Pinned messages fetched", messages);
  } catch (err) {
    next(err);
  }
};

export const search = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { q } = req.query;
    const { id: userId, clinicId } = req.user!;
    if (!q || typeof q !== "string") {
      return res
        .status(400)
        .json({ success: false, message: "Query required" });
    }
    const results = await searchMessages(userId, clinicId, q);
    return successResponse(res, 200, "Search results", results);
  } catch (err) {
    next(err);
  }
};

// src/controllers/message.controller.ts (add these)
export const getMedia = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { conversationId } = req.params as { conversationId: string };
    const { id: userId } = req.user!;
    const media = await getSharedMedia(conversationId, userId);
    return successResponse(res, 200, "Media fetched", media);
  } catch (err) {
    next(err);
  }
};

export const getFiles = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { conversationId } = req.params as { conversationId: string };
    const { id: userId } = req.user!;
    const files = await getSharedFiles(conversationId, userId);
    return successResponse(res, 200, "Files fetched", files);
  } catch (err) {
    next(err);
  }
};
