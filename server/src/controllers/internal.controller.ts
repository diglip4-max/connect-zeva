// src/controllers/internal.controller.ts
import { Request, Response, NextFunction } from "express";
import { User } from "../models/User.model";
import { revokeAllRefreshTokens } from "../services/token.service";
// import { forceDisconnectUser } from "../sockets";
import { successResponse } from "../utils/apiResponse";

export const deactivateUserLocally = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { zevaUserId } = req.body;

    const user = await User.findOneAndUpdate(
      { zevaUserId },
      { isActive: false },
      { new: true },
    );

    if (user) {
      // 1. Refresh token turant revoke - user naya access token nahi le payega
      await revokeAllRefreshTokens(user._id.toString());

      // 2. Agar user abhi live socket pe connected hai, turant disconnect kar do
      //   forceDisconnectUser(user._id.toString());
    }

    return successResponse(res, 200, "User deactivated locally");
  } catch (err) {
    next(err);
  }
};
