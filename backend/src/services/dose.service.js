import { prisma } from "../config/prisma.js";
import { visibleProfiles } from "./family.service.js";
import { scheduleNow, todayRange } from "./schedule-clock.js";
import { ensureCourseDosesForToday } from "./course-schedule.js";

export async function getTodayDoses(userId, profileId, day = scheduleNow()) {
  const profileFilter = profileId === undefined
    ? { ownerId: userId }
    : { id: profileId, ...visibleProfiles(userId) };

  if (profileId !== undefined) {
    if (typeof profileId !== "string" || !profileId.trim()) {
      throw Object.assign(new Error("Некорректный ID профиля"), {
        statusCode: 400
      });
    }

    const profile = await prisma.healthProfile.findFirst({
      where: profileFilter,
      select: { id: true }
    });

    if (!profile) {
      throw Object.assign(new Error("Профиль недоступен"), {
        statusCode: 404
      });
    }
  }

  await ensureCourseDosesForToday(profileFilter, day);

  return prisma.scheduledDose.findMany({
    where: {
      scheduledAt: todayRange(day),
      courseMedicine: {
        course: { profile: profileFilter, status: { not: "ARCHIVED" } }
      }
    },
    include: {
      courseMedicine: {
        include: { medicine: true }
      }
    },
    orderBy: { scheduledAt: "asc" }
  });
}