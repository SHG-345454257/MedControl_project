import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma.js";

// Регистрация пользователя
export async function registerUser({ name, email, password }) {
  const normalizedEmail = email.trim().toLowerCase();

  // Проверяем, существует ли пользователь с таким email
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail }
  });

  if (existingUser) {
    const error = new Error("Пользователь с таким email уже зарегистрирован");
    error.statusCode = 409;
    throw error;
  }

  // Хэшируем пароль
  const passwordHash = await bcrypt.hash(password, 12);

  // Создаём пользователя и его основной медицинский профиль
  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,

      ownedProfiles: {
        create: {
          name: name.trim(),
          relationLabel: "SELF",
          isPrimary: true
        }
      },
      notificationSettings: {
        create: {}
      }
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true
    }
  });

  return user;
}

// Авторизация пользователя
export async function loginUser({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();

  // Ищем пользователя в базе данных
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail }
  });

  if (!user) {
    const error = new Error("Неверный email или пароль");
    error.statusCode = 401;
    throw error;
  }

  // Сравниваем введённый пароль с сохранённым хэшем
  const isPasswordValid = await bcrypt.compare(
    password,
    user.passwordHash
  );

  if (!isPasswordValid) {
    const error = new Error("Неверный email или пароль");
    error.statusCode = 401;
    throw error;
  }

  // Создаём токен авторизации
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET не настроен");
  }

  const token = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email
    }
  };
}

// Смена пароля пользователя
export async function changePassword(userId, {
  currentPassword,
  newPassword
}) {
  // Находим пользователя
  const user = await prisma.user.findUnique({
    where: {
      id: userId
    }
  });

  if (!user) {
    const error = new Error("Пользователь не найден");
    error.statusCode = 404;
    throw error;
  }

  // Проверяем текущий пароль
  const isPasswordValid = await bcrypt.compare(
    currentPassword,
    user.passwordHash
  );

  if (!isPasswordValid) {
    const error = new Error("Неверный текущий пароль");
    error.statusCode = 400;
    throw error;
  }

  // Проверяем, отличается ли новый пароль от текущего
  const isSamePassword = await bcrypt.compare(
    newPassword,
    user.passwordHash
  );

  if (isSamePassword) {
    const error = new Error("Новый пароль должен отличаться от текущего");
    error.statusCode = 400;
    throw error;
  }

  // Хэшируем новый пароль
  const newPasswordHash = await bcrypt.hash(newPassword, 12);

  // Сохраняем новый хэш
  await prisma.user.update({
    where: {
      id: userId
    },
    data: {
      passwordHash: newPasswordHash
    }
  });

  return true;
}