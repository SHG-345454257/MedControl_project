import { Router } from "express";
import { getToday } from "../controllers/dose.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { prisma } from "../config/prisma.js";
import { stockAmountForDose } from "../services/dose-stock.js";

const router = Router();

router.get("/today", authMiddleware, getToday);

function fail(statusCode, message) {
  throw Object.assign(new Error(message), { statusCode });
}

router.patch("/:id/status", authMiddleware, async (req, res, next) => {
  const status = req.body?.status;
  if (status !== "TAKEN" && status !== "PLANNED") {
    return res.status(400).json({ message: "Некорректный статус приёма" });
  }

  try {
    const result = await prisma.$transaction(async (db) => {
      const where = {
        id: req.params.id,
        courseMedicine: { course: { profile: { ownerId: req.userId } } }
      };
      const dose = await db.scheduledDose.findFirst({
        where,
        include: { courseMedicine: { include: { medicine: true } } }
      });
      if (!dose || !["PLANNED", "TAKEN"].includes(dose.status)) {
        fail(404, "Приём недоступен для изменения");
      }

      const { id } = dose;
      if (dose.status === status) return { id, status, takenAt: dose.takenAt };

      const marking = status === "TAKEN";
      const { medicine } = dose.courseMedicine;
      const amount = marking ? stockAmountForDose(dose.courseMedicine) : dose.stockDebited;
      const unit = marking ? medicine.quantityUnit : dose.stockDebitedUnit;
      const takenAt = marking ? new Date() : null;

      if (marking && (!amount || Number(amount) <= 0)) {
        fail(409, "Проверьте единицы дозировки курса и остатка в аптечке");
      }

      const changed = await db.scheduledDose.updateMany({
        where: { ...where, status: dose.status },
        data: {
          status, takenAt,
          stockDebited: marking ? amount : null,
          stockDebitedUnit: marking ? unit : null
        }
      });
      if (!changed.count) fail(409, "Статус уже изменился. Обновите дашборд");

      if (amount !== null) {
        const updated = await db.medicine.updateMany({
          where: {
            id: medicine.id,
            quantityUnit: unit,
            ...(marking ? { quantity: { gte: amount } } : {})
          },
          data: { quantity: marking ? { decrement: amount } : { increment: amount } }
        });
        if (!updated.count) {
          fail(409, marking
            ? "В аптечке недостаточно препарата или изменились единицы остатка"
            : "Единица остатка изменилась. Верните прежнюю единицу перед отменой отметки");
        }
      }

      return { id, status, takenAt };
    });

    res.json(result);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(error);
  }
});

export default router;
