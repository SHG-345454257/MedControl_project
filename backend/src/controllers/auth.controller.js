import {
  registerUser,
  loginUser
} from "../services/auth.service.js";

import { prisma } from "../config/prisma.js";

// Обработчик регистрации
export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    const user = await registerUser({
      name,
      email,
      password
    });

    res.status(201).json({
      status: "success",
      message: "Регистрация прошла успешно",
      user
    });
  } catch (error) {
    next(error);
  }
}

// Обработчик входа
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const result = await loginUser({
      email,
      password
    });

    res.status(200).json({
      status: "success",
      message: "Вход выполнен успешно",
      ...result
    });
  } catch (error) {
    next(error);
  }
}

// Получение данных текущего пользователя
export async function getMe(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.userId
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "Пользователь не найден"
      });
    }

    res.status(200).json({
      status: "success",
      user
    });
  } catch (error) {
    next(error);
  }
}