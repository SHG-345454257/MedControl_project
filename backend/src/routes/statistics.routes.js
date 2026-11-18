import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

function dateKey(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function addYearPlan(buckets, courses, doses, now) {
  const recorded = new Set(doses.map((dose) =>
    `${dose.courseMedicineId}:${dose.scheduledAt.getTime()}`
  ));
  const year = now.getFullYear();

  for (const course of courses) {
    const first = course.startDate.toISOString().slice(0, 10);
    const last = course.endDate?.toISOString().slice(0, 10);
    const rules = course.medicines.flatMap((medicine) =>
      medicine.scheduleRules.map(({ timeOfDay }) => ({
        medicineId: medicine.id,
        timeOfDay
      }))
    );
    if (!rules.length) continue;

    // Historical dates rely on recorded doses: today's rules may have changed since then.
    const day = new Date(year, now.getMonth(), now.getDate());
    for (; day.getFullYear() === year; day.setDate(day.getDate() + 1)) {
      const key = dateKey(day);
      if (key < first) continue;
      if (last && key > last) break;

      for (const { medicineId, timeOfDay } of rules) {
        const [hours, minutes] = timeOfDay.split(":").map(Number);
        const time = new Date(day);
        time.setHours(hours, minutes, 0, 0);
        const doseKey = `${medicineId}:${time.getTime()}`;
        if (!recorded.has(doseKey)) {
          buckets[day.getMonth()].planned++;
          recorded.add(doseKey);
        }
      }
    }
  }
}

router.get("/", authMiddleware, async (req, res, next) => {
  try {
    const { period = "week", month } = req.query;

    if (
      !["week", "year"].includes(period) ||
      typeof month !== "string" ||
      !/^[1-9]\d{3}-(0[1-9]|1[0-2])$/.test(month)
    ) {
      return res.status(400).json({ message: "Укажите период и месяц в формате ГГГГ-ММ" });
    }

    const now = new Date();
    const year = now.getFullYear();
    const weekStart = new Date(year, now.getMonth(), now.getDate());
    weekStart.setDate(weekStart.getDate() - (weekStart.getDay() + 6) % 7);

    const bucketCount = period === "week" ? 7 : 12;
    const boundaries = Array.from({ length: bucketCount + 1 }, (_, index) =>
      period === "week"
        ? new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + index)
        : new Date(year, index, 1)
    );

    const [calendarYear, calendarMonth] = month.split("-").map(Number);
    const monthStart = new Date(calendarYear, calendarMonth - 1, 1);
    const monthEnd = new Date(calendarYear, calendarMonth, 1);

    const doses = await prisma.scheduledDose.findMany({
      where: {
        status: { in: ["TAKEN", "MISSED", "PLANNED", "SKIPPED"] },
        courseMedicine: { course: { profile: { ownerId: req.userId } } },
        OR: [
          { scheduledAt: { gte: boundaries[0], lt: boundaries[bucketCount] } },
          { scheduledAt: { gte: monthStart, lt: monthEnd } }
        ]
      },
      select: { scheduledAt: true, status: true, courseMedicineId: true }
    });

    const buckets = boundaries.slice(0, -1).map((start) => ({
      date: dateKey(start),
      taken: 0,
      missed: 0,
      planned: 0
    }));
    const days = {};

    for (const dose of doses) {
      const { scheduledAt } = dose;
      const status = dose.status === "PLANNED" && scheduledAt <= now
        ? "MISSED"
        : dose.status;
      const index = boundaries.findIndex(
        (start, index) => index < bucketCount &&
          scheduledAt >= start && scheduledAt < boundaries[index + 1]
      );

      if (index >= 0 && status === "TAKEN") buckets[index].taken++;
      if (index >= 0 && status === "MISSED") buckets[index].missed++;
      if (period === "year" && index >= 0 && status === "PLANNED") {
        buckets[index].planned++;
      }

      if (scheduledAt >= monthStart && scheduledAt < monthEnd) {
        const key = dateKey(scheduledAt);
        const day = days[key] ??= { taken: 0, missed: 0, planned: 0 };
        if (status === "TAKEN") day.taken++;
        if (status === "MISSED") day.missed++;
        if (status === "PLANNED") day.planned++;
      }
    }

    if (period === "year") {
      const courses = await prisma.treatmentCourse.findMany({
        where: {
          profile: { ownerId: req.userId },
          status: "ACTIVE",
          startDate: { lt: new Date(Date.UTC(year + 1, 0, 1)) },
          OR: [
            { endDate: null },
            { endDate: { gte: new Date(`${dateKey(now)}T00:00:00Z`) } }
          ]
        },
        select: {
          startDate: true,
          endDate: true,
          medicines: {
            select: {
              id: true,
              scheduleRules: {
                where: { frequency: "DAILY" },
                select: { timeOfDay: true }
              }
            }
          }
        }
      });
      addYearPlan(buckets, courses, doses, now);
    }

    res.set("Cache-Control", "no-store");
    res.json({
      period,
      month,
      from: buckets[0].date,
      to: dateKey(new Date(boundaries[bucketCount].getTime() - 1)),
      buckets,
      days
    });
  } catch (error) {
    next(error);
  }
});

export default router;
