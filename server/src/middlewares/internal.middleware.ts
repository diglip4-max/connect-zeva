// src/middlewares/internal.middleware.ts
import { Request, Response, NextFunction } from "express";
import { ENV } from "../config/env";

export const verifyInternalApiKey = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const apiKey = req.headers["x-internal-api-key"];
  if (apiKey !== ENV.ZEVA_INTERNAL_API_KEY) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }
  next();
};
