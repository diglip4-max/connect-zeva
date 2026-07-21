// src/sockets/index.ts
import { Server } from "socket.io";
import http from "http";
import { ENV } from "../config/env";
import {
  ServerToClientEvents,
  ClientToServerEvents,
  SocketData,
} from "@/types/socket.types";
import logger from "@/utils/logger";
import { registerChatHandlers } from "./chat.socket";
import { registerPresenceHandlers } from "./presence.socket";
import { socketAuthMiddleware } from "@/middlewares/socketAuth.middleware";

let ioInstance: Server<ClientToServerEvents, ServerToClientEvents>;

export function initSocketServer(httpServer: http.Server) {
  ioInstance = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    {},
    SocketData
  >(httpServer, {
    cors: { origin: ENV.CLIENT_URL, credentials: true },
  });

  ioInstance.use(socketAuthMiddleware);

  ioInstance.on("connection", (socket) => {
    logger.info({ userId: socket.data.user?.id }, "Socket connected");

    // clinic-wide room, for presence broadcasts
    socket.join(`clinic:${socket.data.user.clinicId}`);

    registerChatHandlers(ioInstance, socket);
    registerPresenceHandlers(ioInstance, socket);
  });

  return ioInstance;
}

// naya - REST controllers se socket broadcast karne ke liye
export function getIO() {
  return ioInstance;
}

export function forceDisconnectUser(userId: string) {
  if (!ioInstance) return;
  ioInstance.sockets.sockets.forEach((socket) => {
    if ((socket.data as SocketData).user?.id === userId) {
      socket.emit("force:logout", { reason: "Your access has been revoked" });
      socket.disconnect(true);
    }
  });
}
