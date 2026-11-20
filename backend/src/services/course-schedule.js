import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { dateKey, scheduleNow, startOfScheduleDay } from "./schedule-clock.js";

function dosesForCourseDay(course, day) {
  const key = dateKey(day);
  if (key < dateKey(course.startDate)) return [];
  if (course.endDate && key > dateKey(course.endDate)) return [];

  return course.medicines.flatMap((medicine) =>
    medicine.scheduleRules.filter(({ frequency }) => frequency === "DAILY").map(({ timeOfDay }) => {
      const [hours, minutes] = timeOfDay.split(":").map(Number);
      const scheduledAt = new Date(day);
      scheduledAt.setUTCHours(hours, minutes, 0, 0);
      return { courseMedicineId: medicine.id, scheduledAt };
    })
  );
}

export async function scheduleCourseDay(db, course, day) {
  const doses = dosesForCourseDay(course, day);
  if (doses.length) {
    await db.scheduledDose.createMany({ data: doses, skipDuplicates: true });
  }
}

// Call before querying the dashboard to extend active schedules each day.
export async function ensureCourseDosesForToday(profileFilter, day = scheduleNow()) {
  const date = startOfScheduleDay(day);
  const eligible = {
    profile: profileFilter,
    status: "ACTIVE",
    startDate: { lte: date },
    OR: [{ endDate: null }, { endDate: { gte: date } }]
  };
  const candidates = await prisma.treatmentCourse.findMany({
    where: eligible,
    select: { id: true }
  });
  if (!candidates.length) return;

  const ids = candidates.map(({ id }) => id);
  await prisma.$transaction(async (db) => {
    // Lock in the same order across requests, then read the latest course rules.
    await db.$queryRaw`
      SELECT "id" FROM "TreatmentCourse"
      WHERE "id" IN (${Prisma.join(ids)})
      ORDER BY "id" FOR UPDATE
    `;
    const courses = await db.treatmentCourse.findMany({
      where: { ...eligible, id: { in: ids } },
      include: { medicines: { include: { scheduleRules: true } } }
    });
    const doses = courses.flatMap((course) => dosesForCourseDay(course, day));
    if (doses.length) {
      await db.scheduledDose.createMany({ data: doses, skipDuplicates: true });
    }
  });
}
