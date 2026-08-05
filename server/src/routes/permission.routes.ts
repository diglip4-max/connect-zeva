import { Router } from "express";
import { getPermissions } from "../controllers/permission.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", requireAuth, getPermissions);

export default router;
