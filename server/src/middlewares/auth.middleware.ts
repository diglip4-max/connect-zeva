// src/middlewares/auth.middleware.ts
import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../services/token.service";
import { getUserById } from "../services/auth.service";
import { AppError } from "../utils/AppError";

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw new AppError("No access token provided", 401);
    }

    const token = authHeader.split(" ")[1];

    // Step 1: verify JWT signature + expiry
    const decoded = verifyAccessToken(token);

    // Step 2: confirm user still exists and is active
    // (important — even if token is valid, user might've been deactivated mid-session)
    const user = await getUserById(decoded.userId);

    req.user = {
      id: user._id.toString(),
      clinicId: user.clinicId,
      role: user.role,
      name: user.name,
    };

    next();
  } catch (err) {
    next(err);
  }
};
