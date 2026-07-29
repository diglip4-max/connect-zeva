// src/sockets/socketAuth.middleware.ts
import { Socket } from "socket.io";
import { verifyAccessToken } from "../services/token.service";
import { getUserById } from "../services/auth.service";
import { SocketData } from "../types/socket.types";
import logger from "../utils/logger";

type ExtendedError = Error & { data?: any };

export const socketAuthMiddleware = async (
  socket: Socket,
  next: (err?: ExtendedError) => void,
) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Authentication token missing"));
    }

    // Step 1: verify JWT signature + expiry
    const decoded = verifyAccessToken(token);

    // Step 2: confirm user still exists and is active
    // (important — catches deactivation even if token hasn't expired yet)
    const user = await getUserById(decoded.userId);

    const socketData: SocketData = {
      user: {
        id: user._id.toString(),
        clinicId: user.clinicId,
        role: user.role,
        name: user.name,
      },
    };

    socket.data = socketData;

    next();
  } catch (err) {
    logger.warn({ err }, "Socket authentication failed");
    next(new Error("Authentication failed"));
  }
};
