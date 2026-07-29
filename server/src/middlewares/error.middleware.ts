// src/middlewares/error.middleware.ts
import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger";
import { AppError } from "../utils/AppError";

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message =
    err instanceof AppError ? err.message : "Internal server error";

  if (statusCode === 500) {
    logger.error({ err, path: req.path }, "Unhandled error");
  } else {
    logger.warn({ message, path: req.path }, "Handled error");
  }

  res.status(statusCode).json({ success: false, message });
};
