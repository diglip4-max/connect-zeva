// src/sockets/presence.socket.ts
import { Server, Socket } from "socket.io";
import { User } from "../models/User.model";
import logger from "../utils/logger";
import {
  ServerToClientEvents,
  ClientToServerEvents,
  SocketData,
} from "../types/socket.types";

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;
type TypedSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  {},
  SocketData
>;

export function registerPresenceHandlers(io: TypedServer, socket: TypedSocket) {
  const currentUser = socket.data.user;

  markUserOnline(io, currentUser.id, currentUser.clinicId);

  socket.on("disconnect", async () => {
    // check karo ki is user ka koi aur socket connection abhi bhi active hai
    // (multi-tab/multi-device case - tab tak offline mat karo jab tak sab band na ho)
    const sockets = await io.fetchSockets();
    const stillConnected = sockets.some(
      (s) => (s.data as SocketData).user?.id === currentUser.id,
    );

    if (!stillConnected) {
      await markUserOffline(io, currentUser.id, currentUser.clinicId);
    }
  });
}

async function markUserOnline(
  io: TypedServer,
  userId: string,
  clinicId: string,
) {
  await User.findByIdAndUpdate(userId, { isOnline: true });
  io.to(`clinic:${clinicId}`).emit("user:online", userId);
  logger.info({ userId }, "User marked online");
}

async function markUserOffline(
  io: TypedServer,
  userId: string,
  clinicId: string,
) {
  await User.findByIdAndUpdate(userId, {
    isOnline: false,
    lastSeenAt: new Date(),
  });
  io.to(`clinic:${clinicId}`).emit("user:offline", userId);
  logger.info({ userId }, "User marked offline");
}
