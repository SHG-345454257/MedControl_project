import { prisma } from "../config/prisma.js";

export function dateKey(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}

export async function scheduleCourseDay(db, course, day) {
  const key = dateKey(day);
  if (key < course.startDate.toISOString().slice(0, 10)) return;
  if (course.endDate && key > course.endDate.toISOString().slice(0, 10)) return;

  const doses = course.medicines.flatMap((medicine) =>
    medicine.scheduleRules.filter(({ frequency }) => frequency === "DAILY").map(({ timeOfDay }) => {
      const [hours, minutes] = timeOfDay.split(":").map(Number);
      const scheduledAt = new Date(day);
      scheduledAt.setHours(hours, minutes, 0, 0);
      return { courseMedicineId: medicine.id, scheduledAt };
    })
  );

  if (doses.length) {
    await db.scheduledDose.createMany({ data: doses, skipDuplicates: true });
  }
}

// Call before querying the dashboard to extend active schedules each day.
export async function ensureCourseDosesForToday(profileFilter, day = new Date()) {
  const date = new Date(`${dateKey(day)}T00:00:00Z`);
  const courses = await prisma.treatmentCourse.findMany({
    where: {
      profile: profileFilter,
      status: "ACTIVE",
      startDate: { lte: date },
      OR: [{ endDate: null }, { endDate: { gte: date } }]
    },
    select: { id: true }
  });

  for (const { id } of courses) {
    await prisma.$transaction(async (db) => {
      await db.$queryRaw`SELECT "id" FROM "TreatmentCourse" WHERE "id" = ${id} FOR UPDATE`;
      const course = await db.treatmentCourse.findFirst({
        where: { id, status: "ACTIVE", profile: profileFilter },
        include: { medicines: { include: { scheduleRules: true } } }
      });
      if (course) await scheduleCourseDay(db, course, day);
    });
  }
}
