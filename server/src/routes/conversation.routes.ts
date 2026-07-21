// src/routes/conversation.routes.ts
import { Router } from "express";
import {
  addMembers,
  createGroup,
  listConversations,
  makeAdmin,
  muteConversation,
  removeAdmin,
  removeMember,
  searchAll,
} from "../controllers/conversation.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();
router.get("/", requireAuth, listConversations);
router.post("/group", requireAuth, createGroup);

// koi POST /direct route nahi ab - lazy creation socket ke through hi hoga
router.post("/group/make-admin", requireAuth, makeAdmin);
router.post("/group/remove-admin", requireAuth, removeAdmin);
router.post("/group/remove-member", requireAuth, removeMember);

router.post("/mute", requireAuth, muteConversation);
router.post("/group/add-members", requireAuth, addMembers);
router.get("/search/global", requireAuth, searchAll);

export default router;
