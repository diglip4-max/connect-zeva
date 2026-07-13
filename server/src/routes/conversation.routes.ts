// src/routes/conversation.routes.ts
import { Router } from "express";
import { listConversations } from "../controllers/conversation.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();
router.get("/", requireAuth, listConversations);
// koi POST /direct route nahi ab - lazy creation socket ke through hi hoga

export default router;
