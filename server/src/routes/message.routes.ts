// src/routes/message.routes.ts
import { Router } from "express";
import {
  forwardMessageController,
  getLinks,
  getMessages,
  getPinned,
  markAsRead,
  pinMessage,
  postMessage,
  reactToMessage,
  removeMessage,
  search,
  updateMessage,
} from "../controllers/message.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

router.get("/search/all", requireAuth, search);
router.post("/send", requireAuth, postMessage);
router.post("/:conversationId/read", requireAuth, markAsRead);

router.get("/:conversationId/links", requireAuth, getLinks);
router.get("/:conversationId", requireAuth, getMessages);

router.post("/:messageId/react", requireAuth, reactToMessage);
router.patch("/:messageId", requireAuth, updateMessage);
router.delete("/:messageId", requireAuth, removeMessage);
router.post("/:messageId/forward", requireAuth, forwardMessageController);

router.post("/:messageId/pin", requireAuth, pinMessage);
router.get("/:conversationId/pinned", requireAuth, getPinned);

export default router;
