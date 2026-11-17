import { Router } from "express";

import {
  register,
  login,
  getMe
} from "../controllers/auth.controller.js";

import {
  validateRegister,
  validateLogin
} from "../validators/auth.validator.js";

import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

// Регистрация
router.post("/register", validateRegister, register);

// Вход
router.post("/login", validateLogin, login);

// Текущий пользователь
router.get("/me", authMiddleware, getMe);

export default router;