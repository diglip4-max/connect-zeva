import { Router } from "express";
import { uploadAttachments } from "../controllers/upload.controller";
import { uploadMiddleware } from "../middlewares/upload.middleware";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

router.post(
  "/",
  requireAuth,
  uploadMiddleware.array("files", 5),
  uploadAttachments,
);

export default router;
