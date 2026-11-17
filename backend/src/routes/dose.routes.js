import { Router } from "express";

import { getToday } from "../controllers/dose.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/today", authMiddleware, getToday);

export default router;