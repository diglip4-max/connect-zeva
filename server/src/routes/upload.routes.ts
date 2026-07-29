import { Router } from "express";
import { uploadAttachments } from "../controllers/upload.controller";
import { uploadMiddleware } from "../middlewares/upload.middleware";
import { requireAuth } from "../middlewares/auth.middleware";
import { uploadLimiter } from "../middlewares/rateLimiter.middleware";

const router = Router();

router.post(
  "/",
  requireAuth,
  uploadLimiter,
  uploadMiddleware.array("files", 5),
  uploadAttachments,
);

export default router;
