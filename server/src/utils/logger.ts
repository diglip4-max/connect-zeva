import pino from "pino";
import { ENV } from "../config/env";

const logger = pino({
  level: ENV.NODE_ENV === "production" ? "info" : "debug",
  transport:
    ENV.NODE_ENV !== "production"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
          },
        }
      : undefined,
});

export default logger;
