import { Router } from "express";
import authRoutes from "./auth.routes.js";
import doseRoutes from "./dose.routes.js";
import profileRoutes from "./profile.routes.js";
import familyRoutes from "./family.routes.js";
import statisticsRoutes from "./statistics.routes.js";
import medicineRoutes from "./medicine.routes.js";
import courseRoutes from "./course.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/dose", doseRoutes);
router.use("/profile", profileRoutes);
router.use("/family", familyRoutes);
router.use("/statistics", statisticsRoutes);
router.use("/medicine", medicineRoutes);
router.use("/courses", courseRoutes);

export default router;