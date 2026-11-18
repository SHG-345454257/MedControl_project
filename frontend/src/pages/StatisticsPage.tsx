import { API_BASE_URL } from "../services/api";
import { useEffect, useState } from "react";

import AppHeader from "../components/layout/AppHeader";
import Footer from "../components/layout/Footer";
import AdherenceChart from "../components/statistics/AdherenceChart";
import type { ChartBucket, StatisticsPeriod } from "../components/statistics/AdherenceChart";
import DoseCalendar from "../components/statistics/DoseCalendar";
import type { CalendarDay } from "../components/statistics/DoseCalendar";

type StatisticsData = {
  period: StatisticsPeriod;
  month: string;
  from: string;
  to: string;
  buckets: ChartBucket[];
  days: Record<string, CalendarDay>;
};

const periods = [
  { value: "week", label: "Неделя" },
  { value: "year", label: "Год" }
] as const;

function currentMonth() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
}

function displayDate(date: string) {
  return date.split("-").reverse().join(".");
}

export default function StatisticsPage() {
  const [period, setPeriod] = useState<StatisticsPeriod>("week");
  const [month, setMonth] = useState(currentMonth);
  const [data, setData] = useState<StatisticsData | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const ready = data?.period === period && data.month === month && !error;

  useEffect(() => {
    const controller = new AbortController();

    async function loadStatistics() {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Войдите в аккаунт, чтобы посмотреть статистику");

        const params = new URLSearchParams({ period, month });
        const response = await fetch(`${API_BASE_URL}/statistics?${params}`, {
          signal: controller.signal,
          headers: { Authorization: `Bearer ${token}` }
        });
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message ?? "Не удалось загрузить статистику");
        }
        if (!controller.signal.aborted) setData(result);
      } catch (error) {
        if (!controller.signal.aborted) {
          setError(error instanceof Error ? error.message : "Не удалось загрузить статистику");
        }
      }
    }

    void loadStatistics();
    return () => controller.abort();
  }, [period, month, attempt]);

  return (
    <div className="flex min-h-screen flex-col bg-background-soft print:min-h-0 print:bg-white print:[print-color-adjust:exact]">
      <div className="print:hidden"><AppHeader activePage="Статистика" /></div>

      <main className="mx-auto w-full max-w-[1100px] flex-1 px-4 py-8 sm:px-6 print:px-0 print:py-0">
        <div className="relative pb-5 sm:pr-36 print:pr-0">
          <img
            src="/images/statistics/leaves.svg"
            alt=""
            className="pointer-events-none absolute bottom-0 right-0 hidden h-28 w-auto object-contain sm:block print:hidden"
          />

          <h1 className="font-heading text-[32px] font-bold">Статистика и отчёты</h1>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 print:hidden">
            <div role="group" aria-label="Период графика" className="flex rounded-pill border border-olive-accent">
              {periods.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={period === value}
                  onClick={() => {
                    if (period === value) return;
                    setError("");
                    setPeriod(value);
                  }}
                  className={`min-w-24 rounded-pill px-4 py-2 text-sm transition-colors ${
                    period === value
                      ? "bg-olive-accent text-background"
                      : "hover:bg-green-bg"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <button
              type="button"
              disabled={!ready}
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-pill bg-olive-accent px-4 py-2 text-sm font-medium text-background transition-colors enabled:hover:bg-green-accent enabled:hover:text-text-main disabled:cursor-not-allowed disabled:opacity-60"
            >
              <img src="/images/statistics/download.svg" alt="" className="size-4 object-contain" />
              Экспорт PDF для врача
            </button>
          </div>

          {ready && (
            <p className="hidden text-sm text-text-secondary print:block">
              Период отчёта {displayDate(data.from)} — {displayDate(data.to)}
            </p>
          )}
        </div>

        {error ? (
          <div role="alert" className="mb-4 rounded-input bg-card p-4 text-sm">
            {error}
            <button
              type="button"
              className="ml-3 underline"
              onClick={() => {
                setError("");
                setAttempt((value) => value + 1);
              }}
            >
              Повторить
            </button>
          </div>
        ) : !ready && (
          <p role="status" className="mb-3 text-sm text-text-secondary">Загрузка статистики…</p>
        )}

        <div className="grid items-stretch gap-5 md:grid-cols-2 print:grid-cols-2 print:gap-3">
          <AdherenceChart
            period={period}
            buckets={data?.period === period ? data.buckets : []}
          />
          <DoseCalendar
            month={month}
            days={data?.month === month ? data.days : {}}
            onMonthChange={(nextMonth) => {
              setError("");
              setMonth(nextMonth);
            }}
          />
        </div>
      </main>

      <div className="print:hidden"><Footer /></div>
    </div>
  );
}
