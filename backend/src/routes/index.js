import { Router } from "express";
import authRoutes from "./auth.routes.js";
import doseRoutes from "./dose.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/dose", doseRoutes);

export default router;