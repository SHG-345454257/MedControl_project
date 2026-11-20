import { createHash, randomBytes } from "node:crypto";
import { prisma } from "../config/prisma.js";
import { todayRange } from "./schedule-clock.js";

function httpError(statusCode, message) {
  return Object.assign(new Error(message), { statusCode });
}

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

export function visibleProfiles(userId) {
  return {
    OR: [
      { ownerId: userId },
      {
        familyAccesses: {
          some: { invitedUserId: userId, status: "ACTIVE" }
        }
      }
    ]
  };
}

export async function getFamily(userId) {
  const profileFilter = visibleProfiles(userId);
  const [profiles, invitations, doses] = await Promise.all([
    prisma.healthProfile.findMany({
      where: profileFilter,
      orderBy: [{ isPrimary: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        relationLabel: true,
        avatarUrl: true,
        ownerId: true,
        isPrimary: true
      }
    }),
    prisma.familyAccess.findMany({
      where: {
        grantedById: userId,
        OR: [
          { status: "ACTIVE" },
          { status: "PENDING", expiresAt: { gt: new Date() } }
        ]
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        invitedEmail: true,
        status: true
      }
    }),
    prisma.scheduledDose.findMany({
      where: {
        scheduledAt: todayRange(),
        courseMedicine: {
          course: { profile: profileFilter, status: { not: "ARCHIVED" } }
        }
      },
      select: {
        status: true,
        courseMedicine: {
          select: { course: { select: { profileId: true } } }
        }
      }
    })
  ]);

  const statsByProfile = new Map();

  for (const dose of doses) {
    const profileId = dose.courseMedicine.course.profileId;
    const stats = statsByProfile.get(profileId) ?? {
      total: 0,
      taken: 0,
      planned: 0
    };

    stats.total += 1;
    if (dose.status === "TAKEN") stats.taken += 1;
    if (dose.status === "PLANNED") stats.planned += 1;
    statsByProfile.set(profileId, stats);
  }

  return {
    profiles: profiles.map((profile) => {
      const isOwned = profile.ownerId === userId;

      return {
        id: profile.id,
        name: profile.name,
        avatarUrl: profile.avatarUrl,
        relationLabel: isOwned && !profile.isPrimary
          ? profile.relationLabel
          : null,
        isSelf: isOwned && profile.isPrimary,
        ...(
          statsByProfile.get(profile.id) ??
          { total: 0, taken: 0, planned: 0 }
        )
      };
    }),
    invitations
  };
}

export async function createFamilyInvitation(userId, inputEmail) {
  const email = typeof inputEmail === "string"
    ? inputEmail.trim().toLowerCase()
    : "";

  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw httpError(400, "Введите корректный email");
  }

  const [user, profile] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true }
    }),
    prisma.healthProfile.findFirst({
      where: { ownerId: userId, isPrimary: true },
      orderBy: { createdAt: "asc" },
      select: { id: true }
    })
  ]);

  if (!user) throw httpError(401, "Войдите в аккаунт");
  if (email === user.email.toLowerCase()) {
    throw httpError(400, "Укажите email близкого");
  }
  if (!profile) {
    throw httpError(404, "Сначала создайте основной медицинский профиль");
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.familyAccess.create({
    data: {
      profileId: profile.id,
      invitedEmail: email,
      grantedById: userId,
      role: "VIEWER",
      status: "PENDING",
      invitationToken: hashToken(token),
      expiresAt
    }
  });

  return { token, expiresAt, recipient: email, inviter: user };
}

export async function acceptFamilyInvitation(userId, token) {
  if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token)) {
    throw httpError(400, "Некорректная ссылка-приглашение");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true }
  });

  if (!user) throw httpError(401, "Войдите в аккаунт");

  const { count } = await prisma.familyAccess.updateMany({
    where: {
      invitationToken: hashToken(token),
      invitedEmail: user.email.toLowerCase(),
      status: "PENDING",
      expiresAt: { gt: new Date() }
    },
    data: {
      status: "ACTIVE",
      invitedUserId: userId,
      invitationToken: null,
      expiresAt: null
    }
  });

  if (count === 0) {
    throw httpError(
      400,
      "Приглашение недоступно. Проверьте срок ссылки и email своего аккаунта"
    );
  }
}

export async function revokeFamilyInvitation(userId, accessId) {
  const access = await prisma.familyAccess.findFirst({
    where: { id: accessId, grantedById: userId },
    select: { id: true, profileId: true, invitedEmail: true }
  });

  if (!access) throw httpError(404, "Приглашение не найдено");

  await prisma.familyAccess.updateMany({
    where: {
      grantedById: userId,
      profileId: access.profileId,
      invitedEmail: access.invitedEmail,
      status: { in: ["PENDING", "ACTIVE"] }
    },
    data: {
      status: "REVOKED",
      invitationToken: null,
      expiresAt: null
    }
  });
}