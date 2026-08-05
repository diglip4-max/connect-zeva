// src/routes/conversation.routes.ts
import { Router } from "express";
import {
  addMembers,
  createGroup,
  getConversation,
  leaveGroupController,
  listConversations,
  makeAdmin,
  muteConversation,
  removeAdmin,
  removeMember,
  searchAll,
  updateGroupController,
} from "../controllers/conversation.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();
router.get("/:conversationId", requireAuth, getConversation);
router.get("/", requireAuth, listConversations);
router.post("/group", requireAuth, createGroup);

// koi POST /direct route nahi ab - lazy creation socket ke through hi hoga
router.post("/group/make-admin", requireAuth, makeAdmin);
router.post("/group/remove-admin", requireAuth, removeAdmin);
router.post("/group/remove-member", requireAuth, removeMember);

router.post("/mute", requireAuth, muteConversation);
router.post("/group/add-members", requireAuth, addMembers);
router.get("/search/global", requireAuth, searchAll);

router.post("/:conversationId/leave", requireAuth, leaveGroupController);
router.patch("/:conversationId/settings", requireAuth, updateGroupController);

export default router;
