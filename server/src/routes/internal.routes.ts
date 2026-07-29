import { Router } from "express";
import { deactivateUserLocally } from "../controllers/internal.controller";
import { verifyInternalApiKey } from "../middlewares/internal.middleware";

const router = Router();

router.post("/user-deactivated", verifyInternalApiKey, deactivateUserLocally);

export default router;
