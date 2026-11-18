import type { DoseTotals } from "./AdherenceChart";

export type CalendarDay = DoseTotals & { planned: number };

type DoseCalendarProps = {
  month: string;
  days: Record<string, CalendarDay>;
  onMonthChange: (month: string) => void;
};

const weekdays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const monthFormat = new Intl.DateTimeFormat("ru-RU", { month: "long", year: "numeric" });

export default function DoseCalendar({ month, days, onMonthChange }: DoseCalendarProps) {
  const [year, monthNumber] = month.split("-").map(Number);
  const firstDay = new Date(year, monthNumber - 1, 1);
  const offset = (firstDay.getDay() + 6) % 7;
  const monthLength = new Date(year, monthNumber, 0).getDate();
  const slotCount = Math.ceil((offset + monthLength) / 7) * 7;
  const monthTitle = monthFormat.format(firstDay).replace(/\s*г\.$/, "");

  function changeMonth(step: number) {
    const date = new Date(year, monthNumber - 1 + step, 1);
    const nextYear = date.getFullYear();
    if (nextYear < 1000 || nextYear > 9999) return;

    const nextMonth = String(date.getMonth() + 1).padStart(2, "0");
    onMonthChange(`${nextYear}-${nextMonth}`);
  }

  return (
    <section className="flex min-w-0 flex-col rounded-card bg-card p-4 shadow-card sm:p-6">
      <h2 className="flex items-center gap-2 font-heading text-xl font-bold sm:text-2xl">
        <img
          src="/images/statistics/calendar.svg"
          alt=""
          className="size-10 shrink-0 rounded-input bg-lilac-bg p-2"
        />
        Календарь приёмов
      </h2>

      <div className="my-3 flex items-center gap-2">
        <button
          type="button"
          aria-label="Предыдущий месяц"
          onClick={() => changeMonth(-1)}
          className="grid size-8 place-items-center rounded-full bg-lilac-bg hover:bg-lilac-light print:hidden"
        >
          <img src="/images/statistics/arrow-left.svg" alt="" className="size-4 object-contain" />
        </button>
        <span aria-live="polite" className="font-heading text-sm font-bold capitalize">
          {monthTitle}
        </span>
        <button
          type="button"
          aria-label="Следующий месяц"
          onClick={() => changeMonth(1)}
          className="grid size-8 place-items-center rounded-full bg-lilac-bg hover:bg-lilac-light print:hidden"
        >
          <img src="/images/statistics/arrow-right.svg" alt="" className="size-4 object-contain" />
        </button>
      </div>

      <table aria-label={`Календарь приёмов, ${monthTitle}`} className="flex-1 table-fixed border-collapse text-center">
        <thead>
          <tr>
            {weekdays.map((label) => (
              <th key={label} scope="col" className="border border-lilac-bg py-2 text-xs font-normal text-text-secondary">
                {label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {Array.from({ length: slotCount / 7 }, (_, row) => (
            <tr key={row}>
              {Array.from({ length: 7 }, (_, column) => {
                const date = row * 7 + column - offset + 1;
                if (date < 1 || date > monthLength) {
                  return <td key={column} className="border border-lilac-bg" />;
                }

                const day = days[`${month}-${String(date).padStart(2, "0")}`];
                const missed = Boolean(day?.missed);
                const complete = Boolean(day && day.taken > 0 && !day.missed && !day.planned);
                const status = missed ? "Есть пропущенные" : complete ? "Все лекарства приняты" : "";

                return (
                  <td key={column} className="h-10 border border-lilac-bg text-sm sm:h-12">
                    <span className="block font-heading font-bold">{date}</span>
                    <span
                      aria-hidden="true"
                      className={`mx-auto mt-1 block size-2 rounded-full ${
                        missed ? "bg-warning" : complete ? "bg-green-accent" : "bg-transparent"
                      }`}
                    />
                    {status && <span className="sr-only"> {status}</span>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-secondary">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-green-accent" />
          Все лекарства приняты
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-warning" />
          Есть пропущенные
        </span>
      </div>
    </section>
  );
}
