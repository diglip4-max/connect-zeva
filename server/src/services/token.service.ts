import jwt from "jsonwebtoken";
import crypto from "crypto";
import { ENV } from "../config/env";
import { RefreshToken } from "../models/RefreshToken.model";
import { AppError } from "../utils/AppError";
import { JwtPayload } from "../types/models.types";

// -------- Access Token --------
export function generateAccessToken(payload: JwtPayload) {
  return jwt.sign(payload, ENV.JWT_ACCESS_SECRET as string, {
    expiresIn: `${ENV.ACCESS_TOKEN_EXPIRES_IN_MINUTES}m`,
  });
}

export function verifyAccessToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, ENV.JWT_ACCESS_SECRET) as JwtPayload;
  } catch {
    throw new AppError("Invalid or expired access token", 401);
  }
}

// -------- Refresh Token --------
function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function generateRefreshToken(userId: string) {
  // jti - random unique ID, taaki do parallel calls kabhi identical token na banaein
  const jti = crypto.randomBytes(16).toString("hex");

  const rawToken = jwt.sign({ userId, jti }, ENV.JWT_REFRESH_SECRET, {
    expiresIn: `${ENV.REFRESH_TOKEN_EXPIRES_IN_DAYS}d`,
  });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + ENV.REFRESH_TOKEN_EXPIRES_IN_DAYS);

  const tokenHash = hashToken(rawToken);

  // findOneAndUpdate + upsert - agar kisi wajah se (race condition) same tokenHash
  // dobara aa jaye, yeh insert crash karne ke bajaye existing doc ko hi update kar dega
  await RefreshToken.findOneAndUpdate(
    { tokenHash },
    {
      $setOnInsert: {
        userId,
        tokenHash,
        expiresAt,
      },
    },
    { upsert: true, returnDocument: "after" },
  );

  return rawToken;
}

export async function verifyAndRotateRefreshToken(rawToken: string) {
  let decoded: { userId: string };
  try {
    decoded = jwt.verify(rawToken, ENV.JWT_REFRESH_SECRET) as {
      userId: string;
    };
  } catch {
    throw new AppError("Invalid or expired refresh token", 401);
  }

  const tokenHash = hashToken(rawToken);
  const storedToken = await RefreshToken.findOne({
    tokenHash,
    userId: decoded.userId,
  });

  if (!storedToken || storedToken.isRevoked) {
    throw new AppError("Refresh token has been revoked or not found", 401);
  }

  // rotation: purana revoke, naya issue
  storedToken.isRevoked = true;
  await storedToken.save();

  const newRawToken = await generateRefreshToken(decoded.userId);

  return { userId: decoded.userId, newRefreshToken: newRawToken };
}

export async function revokeAllRefreshTokens(userId: string) {
  await RefreshToken.updateMany({ userId }, { isRevoked: true });
}

export async function revokeRefreshToken(rawToken: string) {
  const tokenHash = hashToken(rawToken);
  await RefreshToken.updateOne({ tokenHash }, { isRevoked: true });
}
