// src/controllers/conversation.controller.ts
import { Request, Response, NextFunction } from "express";
import { getUnifiedChatList } from "../services/conversation.service";
import { successResponse } from "../utils/apiResponse";

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
