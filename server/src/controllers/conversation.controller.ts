// src/controllers/conversation.controller.ts
import { Request, Response, NextFunction } from "express";
import {
  addGroupMembers,
  createGroupConversation,
  getUnifiedChatList,
  leaveGroup,
  makeGroupAdmin,
  removeGroupAdmin,
  removeGroupMember,
  searchPeopleAndConversations,
  toggleMuteConversation,
  updateGroupSettings,
} from "../services/conversation.service";
import { successResponse } from "../utils/apiResponse";
import { getIO } from "@/sockets";

export const listConversations = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id: currentUserId, clinicId } = req.user!;
    const result = await getUnifiedChatList(currentUserId, clinicId);
    return successResponse(res, 200, "Chat list fetched", result);
  } catch (err) {
    next(err);
  }
};

export const createGroup = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { groupName, memberIds } = req.body;
    const { id: currentUserId, clinicId } = req.user!;

    if (!Array.isArray(memberIds)) {
      return res
        .status(400)
        .json({ success: false, message: "memberIds must be an array" });
    }

    const conversation = await createGroupConversation(
      currentUserId,
      clinicId,
      groupName,
      memberIds,
    );

    // saare members ko populate karke bhejo (frontend ko poori info chahiye)
    await conversation.populate("members", "name avatarUrl role isOnline");

    const io = getIO();
    if (io) {
      const allMemberIds = conversation.members.map((m: any) =>
        m._id.toString(),
      );

      // har member ke jitne bhi active socket connections hain, unhe group room me join karwao
      const sockets = await io.fetchSockets();
      sockets.forEach((socket) => {
        const socketUserId = (socket.data as any).user?.id;
        if (allMemberIds.includes(socketUserId)) {
          socket.join(`conversation:${conversation._id}`);
        }
      });

      // ab room ban chuka hai (sab active members join ho chuke), broadcast karo
      io.to(`conversation:${conversation._id}`).emit("conversation:new", {
        _id: conversation._id.toString(),
        type: conversation.type,
        members: (conversation.members as any[]).map((m) => ({
          _id: m._id.toString(),
          name: m.name,
          avatarUrl: m.avatarUrl || "",
          role: m.role,
          isOnline: m.isOnline,
        })),
        groupName: conversation.groupName,
        groupAvatarUrl: conversation.groupAvatarUrl,
        lastMessage: { text: "" },
        lastMessageAt: conversation.lastMessageAt?.toISOString(),
        admins: conversation.admins?.map((a: any) => a.toString()),
      });
    }

    return successResponse(res, 201, "Group created", conversation);
  } catch (err) {
    next(err);
  }
};

/*
  Make a member admin in a group conversation
*/
export const makeAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { conversationId, userId: targetUserId } = req.body;
    const { id: requesterId } = req.user!;
    const conversation = await makeGroupAdmin(
      conversationId,
      requesterId,
      targetUserId,
    );
    return successResponse(res, 200, "Member is now admin", conversation);
  } catch (err) {
    next(err);
  }
};

/*
  Remove admin rights from a member in a group conversation
*/
export const removeAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { conversationId, userId: targetUserId } = req.body;
    const { id: requesterId } = req.user!;
    const conversation = await removeGroupAdmin(
      conversationId,
      requesterId,
      targetUserId,
    );
    return successResponse(res, 200, "Admin rights removed", conversation);
  } catch (err) {
    next(err);
  }
};

/*
  Remove a member from a group conversation
*/
export const removeMember = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { conversationId, userId: targetUserId } = req.body;
    const { id: requesterId } = req.user!;
    const conversation = await removeGroupMember(
      conversationId,
      requesterId,
      targetUserId,
    );

    await conversation.populate("members", "name avatarUrl role isOnline");
    const io = getIO();
    if (io) {
      io.to(`conversation:${conversation._id}`).emit(
        "conversation:membersRemoved",
        {
          conversationId: conversation._id.toString(),
          members: (conversation.members as any[]).map((m) => ({
            _id: m._id.toString(),
            name: m.name,
            avatarUrl: m.avatarUrl || "",
            role: m.role,
            isOnline: m.isOnline,
          })),
        },
      );
    }

    return successResponse(res, 200, "Member removed", conversation);
  } catch (err) {
    next(err);
  }
};

// src/controllers/conversation.controller.ts (add these)
export const muteConversation = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { conversationId } = req.body;
    const { id: userId } = req.user!;
    const conversation = await toggleMuteConversation(conversationId, userId);
    return successResponse(res, 200, "Mute status updated", conversation);
  } catch (err) {
    next(err);
  }
};

export const addMembers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { conversationId, memberIds } = req.body;
    const { id: requesterId } = req.user!;
    const conversation = await addGroupMembers(
      conversationId,
      requesterId,
      memberIds,
    );

    await conversation.populate("members", "name avatarUrl role isOnline");
    const io = getIO();
    if (io) {
      // naye members ko room join karwao
      const sockets = await io.fetchSockets();
      sockets.forEach((socket) => {
        if (memberIds.includes((socket.data as any).user?.id)) {
          socket.join(`conversation:${conversation._id}`);
        }
      });
      io.to(`conversation:${conversation._id}`).emit(
        "conversation:membersAdded",
        {
          conversationId: conversation._id.toString(),
          members: (conversation.members as any[]).map((m) => ({
            _id: m._id.toString(),
            name: m.name,
            avatarUrl: m.avatarUrl || "",
            role: m.role,
            isOnline: m.isOnline,
          })),
        },
      );
    }

    return successResponse(res, 200, "Members added", conversation);
  } catch (err) {
    next(err);
  }
};

export const searchAll = async (
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
    const results = await searchPeopleAndConversations(userId, clinicId, q);
    return successResponse(res, 200, "Search results", results);
  } catch (err) {
    next(err);
  }
};

// src/controllers/conversation.controller.ts
export const leaveGroupController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { conversationId } = req.params as { conversationId: string };
    const { id: userId } = req.user!;

    const conversation = await leaveGroup(conversationId, userId);

    const io = getIO();
    if (io) {
      // socket se turant nikaal do room se, aur baaki members ko batao
      const sockets = await io.fetchSockets();
      sockets.forEach((socket) => {
        if ((socket.data as any).user?.id === userId) {
          socket.leave(`conversation:${conversationId}`);
        }
      });
      io.to(`conversation:${conversationId}`).emit("conversation:memberLeft", {
        conversationId,
        userId,
        newAdmins:
          conversation?.admins?.map((a: any) => a.toString() || "") || [],
      });
    }

    return successResponse(res, 200, "Left group successfully");
  } catch (err) {
    next(err);
  }
};

export const updateGroupController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { conversationId } = req.params as { conversationId: string };
    const { groupName, groupAvatarUrl } = req.body as {
      groupName?: string;
      groupAvatarUrl?: string;
    };
    const { id: userId } = req.user!;

    const conversation = await updateGroupSettings(conversationId, userId, {
      groupName,
      groupAvatarUrl,
    });

    const io = getIO();
    if (io) {
      io.to(`conversation:${conversationId}`).emit("conversation:updated", {
        conversationId,
        groupName: conversation.groupName,
        groupAvatarUrl: conversation.groupAvatarUrl,
      });
    }

    return successResponse(res, 200, "Group updated", conversation);
  } catch (err) {
    next(err);
  }
};
