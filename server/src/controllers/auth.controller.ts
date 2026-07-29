// src/controllers/auth.controller.ts
import { Request, Response, NextFunction } from "express";
import {
  loginWithSSOTicket,
  getUserById,
  loginWithCredentials,
} from "../services/auth.service";
import { ENV } from "../config/env";
import { successResponse } from "../utils/apiResponse";
import {
  verifyAndRotateRefreshToken,
  generateAccessToken,
  revokeRefreshToken,
} from "../services/token.service";

const REFRESH_COOKIE_NAME = "zeva_connect_refresh";

const cookieOptions = {
  httpOnly: true,
  secure: ENV.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  path: "/api/v1/auth", // cookie sirf auth routes ke liye bheja jaye
};

// ---------------------------------------------
// POST /api/auth/sso/verify
// Ticket verify karta hai Zeva se, access+refresh token issue karta hai
// ---------------------------------------------
export const verifySSO = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { ticket } = req.body;
    if (!ticket) {
      return res
        .status(400)
        .json({ success: false, message: "Ticket is required" });
    }

    const { accessToken, refreshToken, user } =
      await loginWithSSOTicket(ticket);

    res.cookie(REFRESH_COOKIE_NAME, refreshToken, cookieOptions);

    return successResponse(res, 200, "Login successful", {
      accessToken,
      user: {
        id: user._id,
        clinicId: user.clinicId,
        name: user.name,
        avatarUrl: user.avatarUrl,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------
// POST /api/auth/login
// Login with credentials, access+refresh token issue karta hai
// ---------------------------------------------

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required" });
    }

    const { accessToken, refreshToken, user } = await loginWithCredentials(
      email,
      password,
    );

    res.cookie(REFRESH_COOKIE_NAME, refreshToken, cookieOptions);

    return successResponse(res, 200, "Login successful", {
      accessToken,
      user: {
        id: user._id,
        clinicId: user.clinicId,
        name: user.name,
        avatarUrl: user.avatarUrl,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------
// POST /api/auth/refresh
// Refresh token cookie se naya access token deta hai (with rotation)
// ---------------------------------------------
export const refreshAccessToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!refreshToken) {
      return res
        .status(401)
        .json({ success: false, message: "No refresh token provided" });
    }

    const { userId, newRefreshToken } =
      await verifyAndRotateRefreshToken(refreshToken);
    const user = await getUserById(userId);

    const newAccessToken = generateAccessToken({
      userId: user._id.toString(),
      zevaUserId: user.zevaUserId,
      clinicId: user.clinicId,
      role: user.role,
    });

    res.cookie(REFRESH_COOKIE_NAME, newRefreshToken, cookieOptions);

    return successResponse(res, 200, "Token refreshed", {
      accessToken: newAccessToken,
    });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------
// POST /api/auth/logout
// Refresh token revoke karta hai, cookie clear karta hai
// ---------------------------------------------
export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }
    res.clearCookie(REFRESH_COOKIE_NAME, { path: "/api/auth" });
    return successResponse(res, 200, "Logged out successfully");
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------
// GET /api/auth/me
// Current logged-in user ka data deta hai (requireAuth middleware ke baad)
// ---------------------------------------------
export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated" });
    }
    return successResponse(res, 200, "User fetched", req.user);
  } catch (err) {
    next(err);
  }
};
