import { prisma } from "../config/prisma.js";

export async function getTodayDoses(userId) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const doses = await prisma.scheduledDose.findMany({
    where: {
      scheduledAt: {
        gte: startOfDay,
        lte: endOfDay
      },
      courseMedicine: {
        course: {
          profile: {
            ownerId: userId
          }
        }
      }
    },
    include: {
      courseMedicine: {
        include: {
          medicine: true
        }
      }
    },
    orderBy: {
      scheduledAt: "asc"
    }
  });

  return doses;
}