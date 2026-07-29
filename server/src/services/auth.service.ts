import axios from "axios";
import { ENV } from "../config/env";
import { User } from "../models/User.model";
import { AppError } from "../utils/AppError";
import logger from "../utils/logger";
import { ZevaTicketPayload } from "../types/models.types";
import { generateAccessToken, generateRefreshToken } from "./token.service";

async function verifyTicketWithZeva(
  ticket: string,
): Promise<ZevaTicketPayload> {
  try {
    const response = await axios.post(
      `${ENV.ZEVA_AUTH_INTERNAL_URL}/verify-ticket`,
      { ticket },
      {
        headers: { "x-internal-api-key": ENV.ZEVA_INTERNAL_API_KEY },
        timeout: 5000,
      },
    );
    return response.data as ZevaTicketPayload;
  } catch (err) {
    logger.warn({ err }, "SSO ticket verification failed");
    throw new AppError("Invalid or expired login ticket", 401);
  }
}

async function upsertLocalUser(payload: ZevaTicketPayload) {
  return User.findOneAndUpdate(
    { zevaUserId: payload.zevaUserId },
    {
      zevaUserId: payload.zevaUserId,
      clinicId: payload.clinicId,
      name: payload.name,
      avatarUrl: payload.avatarUrl,
      role: payload.role,
      isActive: true,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}

export async function loginWithSSOTicket(ticket: string) {
  const zevaPayload = await verifyTicketWithZeva(ticket);
  const user = await upsertLocalUser(zevaPayload);

  if (!user.isActive) {
    throw new AppError(
      "Your account is deactivated. Contact your clinic admin.",
      403,
    );
  }

  const accessToken = generateAccessToken({
    userId: user._id.toString(),
    zevaUserId: user.zevaUserId,
    clinicId: user.clinicId,
    role: user.role,
  });
  const refreshToken = await generateRefreshToken(user._id.toString());

  return { accessToken, refreshToken, user };
}

async function verifyCredentialsWithZeva(
  email: string,
  password: string,
): Promise<ZevaTicketPayload> {
  try {
    const response = await axios.post(
      `${ENV.ZEVA_AUTH_INTERNAL_URL}/verify-credentials`,
      { email, password },
      {
        headers: { "x-internal-api-key": ENV.ZEVA_INTERNAL_API_KEY },
        timeout: 5000,
      },
    );
    return response.data.data as ZevaTicketPayload;
  } catch (err) {
    logger.warn({ err }, "Credential verification failed");
    throw new AppError("Invalid email or password", 401);
  }
}

export async function loginWithCredentials(email: string, password: string) {
  const zevaPayload = await verifyCredentialsWithZeva(email, password);
  if (!zevaPayload) {
    throw new AppError("Invalid email or password", 401);
  }
  if (
    !zevaPayload.zevaUserId ||
    !zevaPayload.clinicId ||
    !zevaPayload.name ||
    !zevaPayload.role
  ) {
    throw new AppError("Invalid email or password", 401);
  }
  console.log({ zevaPayload });
  const user = await upsertLocalUser(zevaPayload);
  //   console.log({ user });

  if (!user.isActive) {
    throw new AppError(
      "Your account is deactivated. Contact your clinic admin.",
      403,
    );
  }

  const accessToken = generateAccessToken({
    userId: user._id.toString(),
    zevaUserId: user.zevaUserId,
    clinicId: user.clinicId,
    role: user.role,
  });
  const refreshToken = await generateRefreshToken(user._id.toString());

  return { accessToken, refreshToken, user };
}

export async function getUserById(userId: string) {
  const user = await User.findById(userId);
  if (!user || !user.isActive) {
    throw new AppError("User not found or deactivated", 401);
  }
  return user;
}
