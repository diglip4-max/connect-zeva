import { Router } from "express";
import {
  subscribe,
  unsubscribe,
  listDevices,
  revokeDevice,
} from "../controllers/push.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

router.post("/subscribe", requireAuth, subscribe);
router.post("/unsubscribe", requireAuth, unsubscribe);
router.get("/devices", requireAuth, listDevices);
router.delete("/devices/:id", requireAuth, revokeDevice);

export default router;
