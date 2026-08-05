import express, { Router } from "express";
import authRoutes from "./auth.routes";
import internalRoutes from "./internal.routes";
import userRoutes from "./user.routes";
import conversationRoutes from "./conversation.routes";
import messageRoutes from "./message.routes";
import pushRoutes from "./push.routes";
import uploadRoutes from "./upload.routes";
import permissionRoutes from "./permission.routes";

// router setup
const router: Router = express.Router();

router.get("/health", (req, res) => res.json({ status: "ok" }));

// auth routes
router.use("/auth", authRoutes);

// internal routes
router.use("/internal-api", internalRoutes);

// user routes
router.use("/users", userRoutes);

// conversation routes
router.use("/conversations", conversationRoutes);

// message routes
router.use("/messages", messageRoutes);

// push routes
router.use("/push", pushRoutes);

// upload routes
router.use("/upload", uploadRoutes);

// permission routes
router.use("/permissions", permissionRoutes);

export default router;
