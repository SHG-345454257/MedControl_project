import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {
  getFamilyPage,
  createInvitation,
  acceptInvitation,
  revokeInvitation
} from "../controllers/family.controller.js";

const router = Router();

router.use(authMiddleware);

router.get("/", getFamilyPage);
router.post("/invitations", createInvitation);
router.post("/invitations/accept", acceptInvitation);
router.delete("/invitations/:id", revokeInvitation);

export default router;