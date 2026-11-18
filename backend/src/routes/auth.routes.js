import { Router } from "express";

import {
  register,
  login,
  getMe,
  updatePassword
} from "../controllers/auth.controller.js";

import {
  validateRegister,
  validateLogin,
  validateChangePassword
} from "../validators/auth.validator.js";

import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

// Регистрация
router.post("/register", validateRegister, register);

// Вход
router.post("/login", validateLogin, login);

// Текущий пользователь
router.get("/me", authMiddleware, getMe);

// Смена пароля
router.patch("/change-password", authMiddleware, validateChangePassword, updatePassword);

export default router;