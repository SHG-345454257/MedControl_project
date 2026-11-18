import { prisma } from "../config/prisma.js";
import { todayRange, visibleProfiles } from "./family.service.js";
import { ensureCourseDosesForToday } from "./course-schedule.js";

export async function getTodayDoses(userId, profileId) {
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

  await ensureCourseDosesForToday(profileFilter);

  return prisma.scheduledDose.findMany({
    where: {
      scheduledAt: todayRange(),
      courseMedicine: {
        course: { profile: profileFilter }
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