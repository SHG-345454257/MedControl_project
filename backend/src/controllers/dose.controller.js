import { getTodayDoses } from "../services/dose.service.js";

export async function getToday(req, res, next) {
  try {
    const doses = await getTodayDoses(req.userId, req.query.profileId);

    const result = doses.map((dose) => ({
        id: dose.id,
        time: dose.scheduledAt.toLocaleTimeString("ru-RU", {
          hour: "2-digit",
          minute: "2-digit",
          hourCycle: "h23"
        }),
        name: dose.courseMedicine.medicine.name,
        dosage: `${dose.courseMedicine.doseAmount} ${dose.courseMedicine.doseUnit}`,
        form: dose.courseMedicine.medicine.form,
        status: dose.status,
        takenAt: dose.takenAt
    }));

    res.status(200).json({
      status: "success",
      date: new Date().toISOString().slice(0, 10),
      doses: result
    });
  } catch (error) {
    next(error);
  }
}