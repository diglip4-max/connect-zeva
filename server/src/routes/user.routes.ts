// src/routes/user.routes.ts
import { Router } from "express";
import { getClinicStaff } from "../controllers/user.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();
router.get("/", requireAuth, getClinicStaff);

export default router;
