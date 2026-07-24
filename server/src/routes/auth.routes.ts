import { Router } from "express";
import {
  verifySSO,
  refreshAccessToken,
  logout,
  getMe,
  login,
} from "@/controllers/auth.controller";
import { requireAuth } from "@/middlewares/auth.middleware";
import {
  authLimiter,
  refreshLimiter,
} from "@/middlewares/rateLimiter.middleware";

const router = Router();

router.post("/sso/verify", authLimiter, verifySSO); // public - ticket verify karta hai
router.post("/login", authLimiter, login); // public - email/password login
router.post("/refresh", refreshLimiter, refreshAccessToken); // public - refresh token cookie se naya access token
router.post("/logout", logout); // public - refresh token revoke + cookie clear
router.get("/me", requireAuth, getMe); // protected - current user info

export default router;
