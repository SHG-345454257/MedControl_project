import { useEffect, useState } from "react";

import AppHeader from "../components/layout/AppHeader";
import Footer from "../components/layout/Footer";

type Dose = {
  id: string;
  time: string;
  name: string;
  dosage: string;
  form: string;
  status: string;
  takenAt: string | null;
};

const periods = [
  { key: "morning", label: "Утро" },
  { key: "day", label: "День" },
  { key: "evening", label: "Вечер" }
] as const;

function getPeriod(time: string) {
  const hour = Number(time.split(":")[0]);

  if (hour < 12) return "morning";
  if (hour < 18) return "day";
  return "evening";
}

function getMedicineIcon(form: string) {
  switch (form) {
    case "CAPSULE":
      return "/images/medicines/capsule.svg";
    case "DROPS":
      return "/images/medicines/drop.svg";
    case "OINTMENT":
      return "/images/medicines/lotion.svg";
    case "SPRAY":
      return "/images/medicines/spray.svg";
    default:
      return "/images/medicines/pill.svg";
  }
}

export default function DashboardPage() {
  const [doses, setDoses] = useState<Dose[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingDoseId, setSavingDoseId] = useState<string | null>(null);
  const [doseError, setDoseError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadDoses() {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setError("Пользователь не авторизован");
          return;
        }

        const response = await fetch(
          "http://localhost:3001/api/dose/today",
          {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Не удалось загрузить приёмы");
        }

        if (!controller.signal.aborted) {
          setDoses(data.doses);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setError(
            error instanceof Error
              ? error.message
              : "Не удалось загрузить приёмы"
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadDoses();
    return () => controller.abort();
  }, []);

  async function toggleDose(dose: Dose) {
    if (
      savingDoseId !== null ||
      (dose.status !== "PLANNED" && dose.status !== "TAKEN")
    ) {
      return;
    }

    const status = dose.status === "TAKEN" ? "PLANNED" : "TAKEN";

    setSavingDoseId(dose.id);
    setDoseError("");

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Пользователь не авторизован");

      const response = await fetch(
        `http://localhost:3001/api/dose/${encodeURIComponent(dose.id)}/status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ status })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Не удалось изменить статус приёма");
      }

      setDoses((current) =>
        current.map((item) =>
          item.id === dose.id
            ? { ...item, status: data.status, takenAt: data.takenAt }
            : item
        )
      );
    } catch (error) {
      setDoseError(
        error instanceof Error ? error.message : "Не удалось изменить статус приёма"
      );
    } finally {
      setSavingDoseId(null);
    }
  }

  const today = new Date().toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long"
  });

  return (
    <div className="min-h-screen bg-background-soft">
      <AppHeader />

      <main>
        <section className="relative px-6 pb-8 pt-8">
          <div className="relative z-10 mx-auto flex min-h-[calc(100vh-240px)] max-w-[740px] flex-col">
            <img
              src="/images/dashboard/leaves-dashboard.svg"
              alt=""
              className="pointer-events-none absolute right-[10px] top-[-25px] z-0 h-[120px] w-auto object-contain"
            />

            <div className="relative z-10 mb-5">
              <h1 className="font-heading text-[32px] font-bold leading-none text-text-main">
                Мой день
              </h1>

              <div className="mt-3 flex items-center gap-4 text-[16px] text-text-secondary">
                <img
                  src="/images/dashboard/calendar.svg"
                  alt=""
                  className="h-[22px] w-[22px] object-contain"
                />
                <span>{today}</span>
              </div>
            </div>

            <div className="relative z-10 flex flex-1 flex-col rounded-card bg-card px-5 py-6 shadow-card">
              {loading && (
                <div className="flex flex-1 items-center justify-center">
                  <p role="status" className="text-[14px] text-text-secondary">
                    Загрузка приёмов...
                  </p>
                </div>
              )}

              {!loading && error && (
                <div className="flex flex-1 items-center justify-center">
                  <p role="alert" className="text-[14px] text-text-secondary">
                    {error}
                  </p>
                </div>
              )}

              {!loading && !error && periods.map(({ key, label }, index) => {
                const periodDoses = doses.filter((dose) => getPeriod(dose.time) === key);

                return (
                  <div key={key} className={index === 0 ? "" : "mt-3"}>
                    <div className="flex">
                      <div className="flex h-[29px] items-center gap-2 rounded-pill bg-green-bg px-3">
                        <img
                          src={`/images/dashboard/${key}.svg`}
                          alt=""
                          className="h-[18px] w-[18px] object-contain"
                        />
                        <span className="text-[12px] text-text-main">{label}</span>
                      </div>
                    </div>

                    {periodDoses.length > 0 ? (
                      <div className="mt-3 space-y-2">
                        {periodDoses.map((dose) => (
                          <MedicineRow
                            key={dose.id}
                            dose={dose}
                            saving={savingDoseId !== null}
                            onToggle={() => void toggleDose(dose)}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="py-3 text-center text-[13px] text-text-muted">
                        Приёмов нет
                      </p>
                    )}
                  </div>
                );
              })}

              {doseError && (
                <p role="alert" className="mt-3 text-[13px] text-text-secondary">
                  {doseError}
                </p>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function MedicineRow({
  dose,
  saving,
  onToggle
}: {
  dose: Dose;
  saving: boolean;
  onToggle: () => void;
}) {
  const taken = dose.status === "TAKEN";
  const canToggle = dose.status === "PLANNED" || taken;
  const statusIcon = taken ? "completed.svg" : "uncompleted.svg";

  return (
    <div className="flex h-[55px] items-center rounded-[16px] border border-[#C8D1B5] bg-background px-3">
      <div className="flex h-[34px] w-[73px] shrink-0 items-center justify-center rounded-input bg-green-bg text-[12px] text-text-main">
        {dose.time}
      </div>

      <div className="mx-4 h-[27px] w-px bg-[#C8D1B5]" />

      <div className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full bg-lilac-light">
        <img
          src={getMedicineIcon(dose.form)}
          alt=""
          className="h-[22px] w-[22px] object-contain"
        />
      </div>

      <div className="ml-4 mr-2 min-w-0">
        <p className="text-[14px] leading-[17px] text-text-secondary">
          {dose.name}
        </p>
        <p className="mt-[2px] text-[11px] leading-[14px] text-text-secondary">
          {dose.dosage}
        </p>
      </div>

      {canToggle ? (
        <button
          type="button"
          disabled={saving}
          onClick={onToggle}
          aria-label={`Приём ${dose.name} в ${dose.time}`}
          aria-pressed={taken}
          className="ml-auto grid h-[30px] w-[30px] shrink-0 cursor-pointer place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-olive-accent disabled:cursor-wait"
        >
          <img
            src={`/images/dashboard/${statusIcon}`}
            alt=""
            className="h-full w-full object-contain"
          />
        </button>
      ) : (
        <span className="ml-auto shrink-0 text-[11px] text-text-muted">
          {dose.status === "MISSED" ? "Пропущен" : "Недоступен"}
        </span>
      )}
    </div>
  );
}