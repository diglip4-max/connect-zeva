import express, { Router } from "express";
import authRoutes from "./auth.routes";
import internalRoutes from "./internal.routes";
import userRoutes from "./user.routes";
import conversationRoutes from "./conversation.routes";

const router: Router = express.Router();

router.get("/api/health", (req, res) => res.json({ status: "ok" }));

// auth routes
router.use("/auth", authRoutes);

// internal routes
router.use("/internal-api", internalRoutes);

// user routes
router.use("/users", userRoutes);

// conversation routes
router.use("/conversations", conversationRoutes);

export default router;
