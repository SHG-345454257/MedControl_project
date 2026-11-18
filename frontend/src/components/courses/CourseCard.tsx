import type { Course } from "../../api/course";
import { localDate } from "../../api/course";
import { medicineIcon } from "../../api/medicine";
import type { MedicineForm } from "../../api/medicine";

const days = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const formatDate = (date: string) => date.split("-").reverse().join(".");

export default function CourseCard({
  course,
  onEdit,
  onRemove
}: {
  course: Course;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const totals = course.week.reduce((sum, day) => ({
    taken: sum.taken + day.taken, planned: sum.planned + day.taken + day.missed
  }), { taken: 0, planned: 0 });
  const elapsed = Date.parse(localDate()) - Date.parse(course.startDate);
  const duration = course.endDate ? Date.parse(course.endDate) - Date.parse(course.startDate) : null;
  const progress = duration === null ? null : Math.min(100, Math.max(0,
    Math.round(elapsed / (duration + 86_400_000) * 100)
  ));

  return (
    <article className="relative grid gap-5 rounded-card bg-card p-5 pr-10 shadow-card md:grid-cols-3 md:divide-x md:divide-green-bg sm:p-6 sm:pr-12">
      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex items-start gap-3">
          <img src="/images/courses/course-pills.svg" alt="" className="size-14 shrink-0 object-contain" />
          <div className="min-w-0">
            <h2 className="break-words font-heading text-xl font-bold">{course.title}</h2>
            <p className="mt-2 flex items-center gap-2 text-sm text-text-secondary">
              <img src="/images/courses/calendar-card.svg" alt="" className="size-5 shrink-0 object-contain" />
              {course.isContinuous ? "Постоянно" : `${formatDate(course.startDate)} – ${formatDate(course.endDate ?? course.startDate)}`}
            </p>
          </div>
        </div>
        {course.note && <p className="whitespace-pre-wrap break-words text-sm text-text-secondary">{course.note}</p>}
        {progress !== null && (
          <div className="mt-auto">
            <p className="mb-2 text-sm">По сроку курса: <strong>{progress}%</strong></p>
            <div role="progressbar" aria-label="Прошедшая часть курса" aria-valuenow={progress} className="h-2 rounded-pill bg-background-soft">
              <div style={{ width: `${progress}%` }} className="h-full rounded-pill bg-green-accent" />
            </div>
          </div>
        )}
      </div>

      <div className="min-w-0 md:pl-5">
        <h3 className="font-heading font-bold">Состав курса и график</h3>
        <ul className="mt-2 space-y-2">
          {course.medicines.flatMap((medicine) => medicine.times.map((time) => (
            <li key={`${medicine.medicineId}:${time}`} className="flex items-center gap-2 rounded-pill border border-green-accent px-2 py-1 text-xs">
              <span className="shrink-0 rounded-pill bg-green-bg px-2 py-1">{time}</span>
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-lilac-light">
                <img src={medicineIcon(medicine.form as MedicineForm)} alt="" className="size-4 object-contain" />
              </span>
              <span className="min-w-0 break-words">
                <strong className="block">{medicine.name}</strong>
                {medicine.doseAmount} {medicine.doseUnit}
              </span>
            </li>
          )))}
        </ul>
      </div>

      <div className="min-w-0 md:pl-5">
        <h3 className="font-heading font-bold">Успеваемость курса</h3>
        <p className="mt-1 text-xs text-text-secondary">
          {totals.planned ? `За неделю: ${Math.round(totals.taken / totals.planned * 100)}%` : "Нет отмеченных приёмов"}
        </p>
        <div className="mt-5 flex gap-1 text-center" aria-label="Приёмы за текущую неделю" role="list">
          {days.map((day, index) => {
            const record = course.week[index];
            const total = record ? record.taken + record.missed : 0;
            const percent = total ? Math.round(record.taken / total * 100) : null;
            return (
              <div key={day} role="listitem" aria-label={`${day}, ${percent === null ? "нет данных" : `${percent}%`}`} className="min-w-0 flex-1 text-[10px]">
                <div className="relative h-24 border-b border-text-muted/50">
                  <div className="absolute bottom-0 left-1/2 w-2/5 max-w-4 -translate-x-1/2 rounded-t-stat bg-green-accent" style={{ height: `${percent ?? 0}%` }}>
                    {percent !== null && <span className="absolute bottom-full left-1/2 -translate-x-1/2">{percent}%</span>}
                  </div>
                </div>
                <span className="text-text-secondary">{day}</span>
              </div>
            );
          })}
        </div>
      </div>

      <details className="absolute right-3 top-4 z-10">
        <summary className="grid size-8 cursor-pointer list-none place-items-center rounded-input hover:bg-green-bg [&::-webkit-details-marker]:hidden">
          <img src="/images/courses/menu.svg" alt={`Действия: ${course.title}`} className="size-5 object-contain" />
        </summary>
        <div className="absolute right-0 grid w-32 gap-1 rounded-input bg-card p-2 shadow-card">
          <button type="button" onClick={onEdit} className="rounded-pill bg-green-bg px-2 py-1 text-sm hover:bg-green-accent">Изменить</button>
          <button type="button" onClick={onRemove} className="rounded-pill bg-green-bg px-2 py-1 text-sm hover:bg-green-accent">Удалить</button>
        </div>
      </details>
    </article>
  );
}
