import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { scheduleCourseDay } from "../services/course-schedule.js";
import { scheduleNow, startOfScheduleWeek } from "../services/schedule-clock.js";

const router = Router();
router.use(authMiddleware);

function invalid(message, statusCode = 400) {
  throw Object.assign(new Error(message), { statusCode });
}

function dateValue(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) invalid("Укажите корректные даты");
  const date = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    invalid("Укажите корректные даты");
  }
  return date;
}

function readCourse(body) {
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const note = typeof body?.note === "string" ? body.note.trim() : "";
  if (!title || title.length > 120 || note.length > 2000) invalid("Проверьте название и заметку");

  const startDate = dateValue(body.startDate);
  const isContinuous = body.isContinuous === true;
  const endDate = isContinuous ? null : dateValue(body.endDate);
  if (endDate && endDate < startDate) invalid("Дата окончания должна быть не раньше даты начала");

  if (!Array.isArray(body.medicines) || body.medicines.length < 1 || body.medicines.length > 20) {
    invalid("Добавьте от 1 до 20 препаратов");
  }

  const medicines = body.medicines.map((entry) => {
    const { medicineId, doseAmount, doseUnit, times, reminderEnabled } = entry ?? {};
    if (typeof medicineId !== "string" ||
        typeof doseAmount !== "string" || !/^\d{1,7}(?:[.,]\d{1,3})?$/.test(doseAmount) ||
        Number(doseAmount.replace(",", ".")) <= 0 ||
        typeof doseUnit !== "string" || !doseUnit.trim() || doseUnit.length > 20 ||
        !Array.isArray(times) || times.length === 0 || times.length > 12 ||
        times.some((time) => typeof time !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time))) {
      invalid("Проверьте дозировку и время приёма каждого препарата");
    }

    return {
      medicineId, doseAmount: doseAmount.replace(",", "."), doseUnit: doseUnit.trim(),
      times: [...new Set(times)].sort(), reminderEnabled: reminderEnabled === true
    };
  });

  if (new Set(medicines.map(({ medicineId }) => medicineId)).size !== medicines.length) {
    invalid("Добавьте каждый препарат один раз и укажите все времена приёма");
  }

  return { fields: { title, note: note || null, startDate, endDate, isContinuous }, medicines };
}

const includeCourse = { medicines: { include: { medicine: true, scheduleRules: true } } };

function view(course) {
  return {
    id: course.id, title: course.title, note: course.note,
    startDate: course.startDate.toISOString().slice(0, 10),
    endDate: course.endDate?.toISOString().slice(0, 10) ?? null,
    isContinuous: course.isContinuous, status: course.status,
    medicines: course.medicines.filter((item) => item.scheduleRules.length).map((item) => ({
      medicineId: item.medicineId, name: item.medicine.name, form: item.medicine.form,
      doseAmount: item.doseAmount.toString(), doseUnit: item.doseUnit,
      times: item.scheduleRules.map((rule) => rule.timeOfDay).sort(),
      reminderEnabled: item.scheduleRules.some((rule) => rule.reminderEnabled)
    }))
  };
}

const owned = (userId) => ({ profile: { ownerId: userId }, status: { not: "ARCHIVED" } });

router.get("/", async (req, res, next) => {
  try {
    const courses = await prisma.treatmentCourse.findMany({
      where: owned(req.userId), include: includeCourse, orderBy: { createdAt: "desc" }
    });

    const today = scheduleNow();
    const week = startOfScheduleWeek(today);
    const nextWeek = new Date(week);
    nextWeek.setUTCDate(week.getUTCDate() + 7);
    const doses = await prisma.scheduledDose.findMany({
      where: {
        courseMedicine: { course: owned(req.userId) },
        scheduledAt: { gte: week, lt: nextWeek },
        OR: [
          { status: { in: ["TAKEN", "MISSED"] } },
          { status: "PLANNED", scheduledAt: { lte: today } }
        ]
      },
      select: {
        scheduledAt: true, status: true,
        courseMedicine: { select: { courseId: true } }
      }
    });
    const totals = new Map();
    for (const dose of doses) {
      const id = dose.courseMedicine.courseId;
      const days = totals.get(id) ?? Array.from({ length: 7 }, () => ({ taken: 0, missed: 0 }));
      const bucket = days[(dose.scheduledAt.getUTCDay() + 6) % 7];
      if (dose.status === "TAKEN") bucket.taken++;
      else bucket.missed++;
      totals.set(id, days);
    }

    res.set("Cache-Control", "no-store").json({
      courses: courses.map((course) => ({ ...view(course), week: totals.get(course.id) ?? [] }))
    });
  } catch (error) {
    next(error);
  }
});

async function writeCourse(req, res, next) {
  try {
    const { fields, medicines } = readCourse(req.body);
    const existingId = req.params.id;
    const saved = await prisma.$transaction(async (db) => {
      // All mutations of a course take its row lock before touching schedules.
      if (existingId) {
        await db.$queryRaw`SELECT "id" FROM "TreatmentCourse" WHERE "id" = ${existingId} FOR UPDATE`;
      }
      const existing = existingId ? await db.treatmentCourse.findFirst({
        where: { id: existingId, ...owned(req.userId) }, include: includeCourse
      }) : null;
      if (existingId && !existing) invalid("Курс не найден", 404);

      const selected = await db.medicine.findMany({
        where: {
          id: { in: medicines.map((medicine) => medicine.medicineId) },
          profile: { ownerId: req.userId }
        },
        select: { id: true, profileId: true, isActive: true }
      });

      const profileId = existing?.profileId ?? selected[0]?.profileId;
      const previousIds = new Set(existing?.medicines.map((item) => item.medicineId));
      if (selected.length !== medicines.length || selected.some((medicine) =>
        medicine.profileId !== profileId || (!medicine.isActive && !previousIds.has(medicine.id))
      )) invalid("Выберите доступные препараты из одного профиля");

      const course = existing
        ? await db.treatmentCourse.update({ where: { id: existing.id }, data: fields })
        : await db.treatmentCourse.create({ data: { ...fields, profileId } });

      const now = scheduleNow();
      await db.scheduledDose.deleteMany({
        where: { courseMedicine: { courseId: course.id }, status: "PLANNED", scheduledAt: { gte: now } }
      });
      await db.scheduleRule.deleteMany({ where: { courseMedicine: { courseId: course.id } } });

      for (const { medicineId, doseAmount, doseUnit, times, reminderEnabled } of medicines) {
        const item = await db.courseMedicine.upsert({
          where: { courseId_medicineId: { courseId: course.id, medicineId } },
          create: { courseId: course.id, medicineId, doseAmount, doseUnit },
          update: { doseAmount, doseUnit }
        });
        await db.scheduleRule.createMany({
          data: times.map((timeOfDay) => ({
            courseMedicineId: item.id, frequency: "DAILY", timeOfDay, reminderEnabled
          }))
        });
      }

      const result = await db.treatmentCourse.findUnique({
        where: { id: course.id }, include: includeCourse
      });
      if (result.status === "ACTIVE") await scheduleCourseDay(db, result, now);
      return result;
    });

    res.status(existingId ? 200 : 201).json({ course: view(saved) });
  } catch (error) {
    next(error);
  }
}

router.post("/", writeCourse);
router.patch("/:id", writeCourse);

router.delete("/:id", async (req, res, next) => {
  try {
    await prisma.$transaction(async (db) => {
      const { count } = await db.treatmentCourse.updateMany({
        where: { id: req.params.id, ...owned(req.userId) }, data: { status: "ARCHIVED" }
      });
      if (!count) invalid("Курс не найден", 404);

      await db.scheduledDose.deleteMany({
        where: {
          courseMedicine: { courseId: req.params.id },
          status: "PLANNED", scheduledAt: { gte: scheduleNow() }
        }
      });
    });
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
});

export default router;
