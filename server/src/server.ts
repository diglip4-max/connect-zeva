// src/server.ts
import http from "http";
import app from "./app";
import { connectDB } from "./config/db";
import { ENV } from "./config/env";
import logger from "./utils/logger";
import { initSocketServer } from "./sockets";

const httpServer = http.createServer(app);

// saara socket setup (middleware + handlers) sockets/index.ts ke andar hai
initSocketServer(httpServer);

const start = async () => {
  await connectDB();
  httpServer.listen(ENV.PORT, () => {
    logger.info(`Server running on port ${ENV.PORT}`);
  });
};

start();
