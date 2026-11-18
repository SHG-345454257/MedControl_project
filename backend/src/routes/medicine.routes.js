import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

import { getOnlinePharmacyOffers, onlineSourceIds, pharmacyCatalogs } from "./online-pharmacy-offers.js";
import { getAptekaOffers } from "./apteka-offers.js";

const router = Router();
router.use(authMiddleware);

const forms = new Set([
  "TABLET", "CAPSULE", "DROPS", "SYRUP", "SPRAY", "OINTMENT",
  "INJECTION", "POWDER", "OTHER"
]);

function invalid(message) {
  throw Object.assign(new Error(message), { statusCode: 400 });
}

function text(value, label, maxLength, required = false) {
  if (value == null && !required) return null;
  if (typeof value !== "string") invalid(`Проверьте поле «${label}»`);

  const result = value.trim();
  if ((required && !result) || result.length > maxLength) {
    invalid(`Проверьте поле «${label}»`);
  }
  return result || null;
}

function decimal(value, label, required = false) {
  if ((value == null || value === "") && !required) return null;
  if (typeof value !== "string" || !/^\d{1,7}([.,]\d{1,3})?$/.test(value)) {
    invalid(`Укажите корректное значение поля «${label}»`);
  }
  return value.replace(",", ".");
}

function expiryDate(value) {
  if (!value) return null;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    invalid("Укажите корректный срок годности");
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    invalid("Укажите корректный срок годности");
  }
  return date;
}

function safeUrl(value) {
  if (typeof value !== "string") return null;

  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

function safeImageUrl(value) {
  if (
    typeof value === "string" &&
    value.length <= 80_000 &&
    /^data:image\/(webp|jpeg);base64,[A-Za-z0-9+/]+={0,2}$/.test(value)
  ) {
    const mime = value.slice(0, value.indexOf(";"));
    const bytes = Buffer.from(value.slice(value.indexOf(",") + 1), "base64");
    const isWebp = bytes.toString("ascii", 0, 4) === "RIFF" &&
      bytes.toString("ascii", 8, 12) === "WEBP";
    const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    if (mime === "data:image/webp" ? isWebp : isJpeg) return value;
    return null;
  }

  return safeUrl(value) ?? (
    /^\/images\/[\w./-]+$/.test(value ?? "") ? value : null
  );
}

function medicineData(body = {}) {
  if (!body || !forms.has(body.form)) invalid("Выберите форму выпуска");

  const strengthValue = decimal(body.strengthValue, "Дозировка");
  const imageUrl = text(body.imageUrl, "Фото", 80_000);
  if (imageUrl && !safeImageUrl(imageUrl)) invalid("Не удалось сохранить изображение");

  return {
    name: text(body.name, "Название", 120, true),
    form: body.form,
    strengthValue,
    strengthUnit: strengthValue ? text(body.strengthUnit, "Единица дозировки", 20, true) : null,
    quantity: decimal(body.quantity, "Остаток", true),
    quantityUnit: text(body.quantityUnit, "Единица остатка", 20, true),
    expiryDate: expiryDate(body.expiryDate),
    lowStockThreshold: decimal(body.lowStockThreshold, "Критический остаток"),
    prescriptionRequired: body.prescriptionRequired === true,
    notifyWhenLow: body.notifyWhenLow === true,
    note: text(body.note, "Заметка", 2000),
    imageUrl
  };
}

function ownedMedicines(req) {
  return { isActive: true, profile: { ownerId: req.userId } };
}

function serialize(medicine) {
  return {
    ...medicine,
    expiryDate: medicine.expiryDate?.toISOString().slice(0, 10) ?? null,
    strengthValue: medicine.strengthValue?.toString() ?? null,
    quantity: medicine.quantity.toString(),
    lowStockThreshold: medicine.lowStockThreshold?.toString() ?? null,
    imageUrl: safeImageUrl(medicine.imageUrl)
  };
}

router.get("/", async (req, res, next) => {
  try {
    const medicines = await prisma.medicine.findMany({
      where: ownedMedicines(req),
      orderBy: [{ createdAt: "desc" }, { id: "asc" }]
    });
    res.set("Cache-Control", "no-store").json({ medicines: medicines.map(serialize) });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const medicine = await prisma.medicine.findFirst({
      where: { ...ownedMedicines(req), id: req.params.id },
      include: {
        pharmacyOffers: {
          where: { OR: [{ isAvailable: true }, { isAvailable: null }] },
          orderBy: { price: "asc" }
        }
      }
    });

    if (!medicine) return res.status(404).json({ message: "Лекарство не найдено" });

    const { pharmacyOffers, ...details } = medicine;
    const offers = pharmacyOffers.flatMap((offer) => {
      const productUrl = safeUrl(offer.productUrl);
      return productUrl ? [{
        id: offer.id,
        pharmacyName: offer.pharmacyName,
        productName: offer.productName,
        price: offer.price.toString(),
        currency: offer.currency,
        productUrl
      }] : [];
    });

    res.set("Cache-Control", "no-store").json({
      medicine: serialize(details),
      offers,
      offerSources: ["apteka", ...onlineSourceIds],
      pharmacyCatalogs
    });
  } catch (error) {
    next(error);
  }
});

router.get("/:id/offers/:source", async (req, res, next) => {
  try {
    const { id, source } = req.params;
    if (source !== "apteka" && !onlineSourceIds.includes(source)) {
      return res.status(404).json({ message: "Источник не найден" });
    }

    const medicine = await prisma.medicine.findFirst({
      where: { ...ownedMedicines(req), id },
      select: { name: true, strengthValue: true, strengthUnit: true }
    });
    if (!medicine) return res.status(404).json({ message: "Лекарство не найдено" });

    const result = source === "apteka"
      ? await getAptekaOffers(medicine)
      : await getOnlinePharmacyOffers(medicine, source);
    res.set("Cache-Control", "no-store").json(result);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const data = medicineData(req.body);
    const profile = await prisma.healthProfile.findFirst({
      where: { ownerId: req.userId, isPrimary: true },
      orderBy: { createdAt: "asc" },
      select: { id: true }
    });

    if (!profile) return res.status(404).json({ message: "Сначала создайте основной профиль" });

    const medicine = await prisma.medicine.create({ data: { ...data, profileId: profile.id } });
    res.status(201).json({ medicine: serialize(medicine) });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const data = medicineData(req.body);
    const medicine = await prisma.medicine.update({
      where: { ...ownedMedicines(req), id: req.params.id },
      data
    });

    res.json({ medicine: serialize(medicine) });
  } catch (error) {
    if (error.code === "P2025") return res.status(404).json({ message: "Лекарство не найдено" });
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await prisma.medicine.updateMany({
      where: { ...ownedMedicines(req), id: req.params.id },
      data: { isActive: false }
    });
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
});

export default router;
