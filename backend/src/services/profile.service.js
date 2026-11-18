import { prisma } from "../config/prisma.js";

// Получение основного медицинского профиля
export async function getPrimaryProfile(userId) {
  const profile = await prisma.healthProfile.findFirst({
    where: {
      ownerId: userId,
      isPrimary: true
    },
    select: {
      id: true,
      name: true,
      phone: true,
      birthDate: true,
      gender: true,
      avatarUrl: true
    }
  });

  return profile;
}


export async function updatePrimaryProfile(userId, data) {
  // Находим основной медицинский профиль пользователя
  const profile = await prisma.healthProfile.findFirst({
    where: {
      ownerId: userId,
      isPrimary: true
    }
  });

  if (!profile) {
    return null;
  }

  // Обновляем данные профиля
  const updatedProfile = await prisma.healthProfile.update({
    where: {
      id: profile.id
    },
    data: {
      name: data.name.trim(),
      phone: data.phone || null,
      birthDate: data.birthDate
        ? new Date(`${data.birthDate}T00:00:00.000Z`)
        : null,
      gender: data.gender || null
    },
    select: {
      id: true,
      name: true,
      phone: true,
      birthDate: true,
      gender: true,
      avatarUrl: true
    }
  });

  return updatedProfile;
}


// Получение настроек уведомлений
export async function getNotificationSettings(userId) {
  const settings = await prisma.notificationSettings.findUnique({
    where: {
      userId
    },
    select: {
      pushEnabled: true,
      soundEnabled: true,
      emailReports: true
    }
  });

  return settings;
}

// Обновление настроек уведомлений
export async function updateNotificationSettings(userId, data) {
  const settings = await prisma.notificationSettings.update({
    where: {
      userId
    },
    data,
    select: {
      pushEnabled: true,
      soundEnabled: true,
      emailReports: true
    }
  });

  return settings;
}

//Обновление аватара
export async function updatePrimaryAvatar(userId, avatarUrl) {
  const profile = await getPrimaryProfile(userId);

  if (!profile) {
    return null;
  }

  return prisma.healthProfile.update({
    where: { id: profile.id },
    data: { avatarUrl },
    select: { avatarUrl: true }
  });
}