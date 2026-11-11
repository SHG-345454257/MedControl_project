import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { prisma } from "./config/prisma.js";
import noIndexApi from "./middleware/noIndexApi.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173"
}));
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.use("/api", noIndexApi);

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "MedControl API работает"
  });
});

app.get("/api/health/db", async (req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      status: "ok",
      database: "connected"
    });
  } catch (error) {
    next(error);
  }
});

app.use((req, res) => {
  res.status(404).json({
    status: "fail",
    message: "Маршрут не найден"
  });
});

app.use((error, req, res, next) => {
  console.error(error);

  res.status(500).json({
    status: "error",
    message: "Внутренняя ошибка сервера"
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`MedControl API запущен на порту ${PORT}`);
});

async function shutdown() {
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);