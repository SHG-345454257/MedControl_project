export type DoseTotals = {
  taken: number;
  missed: number;
};

export type ChartBucket = DoseTotals & {
  date: string;
  planned?: number;
};

export type StatisticsPeriod = "week" | "year";

type AdherenceChartProps = {
  period: StatisticsPeriod;
  buckets: ChartBucket[];
};

const weekdays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const months = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];
const ticks = [100, 80, 60, 40, 20, 0];

function percentage({ taken, missed, planned = 0 }: DoseTotals & { planned?: number }) {
  const total = taken + missed + planned;
  return total > 0 ? Math.round(taken / total * 100) : null;
}

export default function AdherenceChart({ period, buckets }: AdherenceChartProps) {
  const labels = period === "week" ? weekdays : months;
  const totals = buckets.reduce(
    (sum, bucket) => ({
      taken: sum.taken + bucket.taken,
      missed: sum.missed + bucket.missed,
      planned: sum.planned + (bucket.planned ?? 0)
    }),
    { taken: 0, missed: 0, planned: 0 }
  );
  const overall = percentage(totals);

  return (
    <section className="flex min-w-0 flex-col rounded-card bg-card p-4 shadow-card sm:p-6">
      <h2 className="flex items-center gap-2 font-heading text-xl font-bold sm:text-2xl">
        <img
          src="/images/statistics/stats-chart.svg"
          alt=""
          className="size-10 shrink-0 rounded-input bg-lilac-bg p-2"
        />
        {period === "week" ? "Дисциплина приёмов" : "Выполнение плана по месяцам"}
      </h2>

      <div className="relative mb-11 ml-9 mt-9 h-56 sm:h-64">
        {ticks.map((tick) => (
          <div
            key={tick}
            className="absolute left-0 w-full border-t border-text-muted/50"
            style={{ bottom: `${tick}%` }}
            aria-hidden="true"
          >
            <span className="absolute right-full mr-1 -translate-y-1/2 whitespace-nowrap text-[10px] text-text-secondary">
              {tick}%
            </span>
          </div>
        ))}

        <div
          className="absolute inset-0 flex border-l border-text-muted/50"
          role="list"
          aria-label="Доля принятых лекарств по периодам"
        >
          {buckets.map((bucket, index) => {
            const value = percentage(bucket);
            const label = labels[index];

            return (
              <div
                key={bucket.date}
                role="listitem"
                aria-label={`${label}: ${value === null ? "нет данных" : `${value}%`}`}
                title={value === null ? undefined : `${bucket.taken} из ${bucket.taken + bucket.missed + (bucket.planned ?? 0)}`}
                className="relative min-w-0 flex-1"
              >
                <div
                  className="absolute bottom-0 left-1/2 w-[58%] max-w-5 -translate-x-1/2 rounded-t-stat bg-green-accent"
                  style={{ height: `${value ?? 0}%` }}
                  aria-hidden="true"
                >
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] leading-4 text-text-secondary sm:text-[10px]">
                    {value === null ? "–" : `${value}%`}
                  </span>
                </div>
                <span aria-hidden="true" className="absolute left-1/2 top-full mt-1 -translate-x-1/2 text-[8px] text-text-secondary sm:text-[10px]">
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-auto flex min-h-16 items-center gap-3 rounded-input bg-background-soft px-3 py-2">
        <img src="/images/statistics/completed.svg" alt="" className="size-8 shrink-0 object-contain" />
        <div>
          <p className="text-xs text-text-secondary">
            {period === "week" ? "В среднем за неделю" : "По плану на год"}
          </p>
          <p className="font-heading font-bold">
            {overall === null
              ? "Нет приёмов за период"
              : period === "year"
                ? `${overall}% выполнено · ${totals.taken} из ${totals.taken + totals.missed + totals.planned}`
                : `${overall}% приёмов выполнено`}
          </p>
        </div>
      </div>
    </section>
  );
}
