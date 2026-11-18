import { Router } from "express";
import {
  getProfile,
  updateProfile,
  getNotifications,
  updateNotifications,
  updateAvatar
} from "../controllers/profile.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", authMiddleware, getProfile);
router.patch("/", authMiddleware, updateProfile);

router.get("/notifications", authMiddleware, getNotifications);
router.patch("/notifications", authMiddleware, updateNotifications);
router.patch("/avatar", authMiddleware, updateAvatar);

export default router;