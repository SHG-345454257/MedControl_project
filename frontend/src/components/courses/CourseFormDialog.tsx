import { useEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { localDate } from "../../api/course";
import type { Course, CourseInput, CourseMedicineInput } from "../../api/course";
import type { Medicine } from "../../api/medicine";

const field = "mt-1 w-full min-w-0 rounded-input border border-text-muted bg-background px-3 py-2 text-sm text-text-main placeholder:text-text-muted focus:border-olive-accent";
const button = "rounded-pill bg-olive-accent px-4 py-2 text-sm text-background hover:bg-green-accent hover:text-text-main disabled:opacity-60";
const checkbox = "size-[22px] shrink-0 appearance-none rounded-input border border-text-muted bg-background checked:border-olive-accent checked:bg-olive-accent checked:after:block checked:after:text-center checked:after:text-background checked:after:content-['✓'] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-olive-accent";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block text-sm">{label}{children}</label>;
}

function Choice({ children }: { children: ReactNode }) {
  return (
    <span className="relative block">
      {children}
      <img src="/images/courses/arrow-down.svg" alt="" className="pointer-events-none absolute bottom-0 right-3 top-1 my-auto size-4 object-contain" />
    </span>
  );
}

function DateField({ label, name, value, required = true }: {
  label: string; name: string; value?: string; required?: boolean;
}) {
  return (
    <Field label={label}>
      <span className="relative block">
        <input type="date" name={name} defaultValue={value} required={required}
          className={`${field} [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0`} />
        <img src="/images/courses/calendar-add.svg" alt=""
          className="pointer-events-none absolute bottom-0 right-3 top-1 my-auto hidden size-5 object-contain supports-[selector(input::-webkit-calendar-picker-indicator)]:block" />
      </span>
    </Field>
  );
}

function MedicineFields({ value, options, onChange, onRemove }: {
  value: CourseMedicineInput;
  options: { id: string; name: string }[];
  onChange: (value: CourseMedicineInput) => void;
  onRemove: () => void;
}) {
  const units = ["табл.", "капс.", "капель", "мг", "мкг", "г", "мл", "ЕД", "доз", "шт."];
  if (!units.includes(value.doseUnit)) units.push(value.doseUnit);

  return (
    <div className="space-y-3 rounded-input border border-green-bg p-3">
      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <Field label="Лекарство">
            <Choice>
              <select required value={value.medicineId} onChange={(event) => onChange({ ...value, medicineId: event.target.value })} className={`${field} appearance-none pr-9`}>
                <option value="">Выберите лекарство…</option>
                {options.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
              </select>
            </Choice>
          </Field>
        </div>
        <button type="button" onClick={onRemove} className="rounded-input px-2 py-2 text-sm underline">Убрать</button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Дозировка на один приём">
          <input required inputMode="decimal" value={value.doseAmount}
            onChange={(event) => onChange({ ...value, doseAmount: event.target.value })} className={field} />
        </Field>
        <Field label="Единица">
          <Choice>
            <select value={value.doseUnit} onChange={(event) => onChange({ ...value, doseUnit: event.target.value })} className={`${field} appearance-none pr-9`}>
              {units.map((unit) => <option key={unit}>{unit}</option>)}
            </select>
          </Choice>
        </Field>
      </div>

      <div>
        <p className="text-sm">Время приёма</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          {value.times.map((time, index) => (
            <div key={index} className="flex items-center gap-1">
              <input type="time" aria-label={`Время приёма ${index + 1}`} required value={time}
                onChange={(event) => onChange({
                  ...value, times: value.times.map((item, i) => i === index ? event.target.value : item)
                })} className="rounded-input border border-text-muted bg-background px-2 py-1 text-sm" />
              {value.times.length > 1 && (
                <button type="button" aria-label={`Убрать время ${time}`}
                  onClick={() => onChange({ ...value, times: value.times.filter((_, i) => i !== index) })}>×</button>
              )}
            </div>
          ))}
          <button type="button" disabled={value.times.length >= 12}
            onClick={() => onChange({ ...value, times: [...value.times, ""] })} className={button}>Добавить время</button>
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-3 text-sm">
        <span>Уведомить за 10 минут до приёма</span>
        <input type="checkbox" checked={value.reminderEnabled}
          onChange={(event) => onChange({ ...value, reminderEnabled: event.target.checked })} className={checkbox} />
      </label>
    </div>
  );
}

const sectionHeading = "rounded-pill bg-green-bg px-3 py-1 text-center font-heading font-bold text-olive-accent";
const blank = (): CourseMedicineInput => ({
  medicineId: "", doseAmount: "", doseUnit: "табл.", times: ["08:00"], reminderEnabled: false
});

export default function CourseFormDialog({ course, medicines, onSave, onClose }: {
  course: Course | null;
  medicines: Medicine[];
  onSave: (data: CourseInput) => Promise<void>;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const nextRowId = useRef(course?.medicines.length ?? 1);
  const [continuous, setContinuous] = useState(course?.isContinuous ?? false);
  const [rows, setRows] = useState(() => (course?.medicines.length ? course.medicines : [blank()])
    .map((value, id) => ({ id, value })));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const options = new Map(medicines.map(({ id, name }) => [id, { id, name }]));
  for (const { medicineId, name } of course?.medicines ?? []) {
    if (!options.has(medicineId)) options.set(medicineId, { id: medicineId, name });
  }

  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    setError("");
    setSaving(true);

    try {
      await onSave({
        title: String(fields.get("title") ?? ""),
        note: String(fields.get("note") ?? ""),
        startDate: String(fields.get("startDate") ?? ""),
        endDate: String(fields.get("endDate") ?? ""),
        isContinuous: continuous,
        medicines: rows.map(({ value }) => value)
      });
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Не удалось сохранить курс");
      setSaving(false);
    }
  }

  return (
    <dialog ref={dialog} aria-labelledby="course-title" onCancel={(event) => {
      event.preventDefault();
      if (!saving) onClose();
    }} className="m-auto max-h-[90vh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-card bg-card p-5 text-text-main shadow-card backdrop:bg-black/30 sm:p-7">
      <div className="flex items-start justify-between gap-3">
        <h2 id="course-title" className="font-heading text-2xl font-bold">
          {course ? "Изменить курс" : "Создать новый курс"}
        </h2>
        <button type="button" aria-label="Закрыть" disabled={saving} onClick={onClose}
          className="grid size-9 shrink-0 place-items-center rounded-input hover:bg-green-bg">
          <img src="/images/courses/exit.svg" alt="" className="size-5 object-contain" />
        </button>
      </div>

      <form onSubmit={submit} className="mt-4">
        <fieldset disabled={saving} className="space-y-4">
          <h3 className={sectionHeading}>Основная информация</h3>
          <Field label="Название курса">
            <input name="title" required maxLength={120} defaultValue={course?.title}
              placeholder='Например, комплекс «Здоровая осень»' className={field} />
          </Field>
          <Field label="Заметка">
            <textarea name="note" maxLength={2000} defaultValue={course?.note ?? ""} rows={2} className={field} />
          </Field>
          <label className="flex cursor-pointer items-center gap-3 text-sm">
            <span>Принимать постоянно</span>
            <input type="checkbox" checked={continuous} onChange={(event) => setContinuous(event.target.checked)} className={checkbox} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <DateField label="Дата начала" name="startDate" value={course?.startDate ?? localDate()} />
            {!continuous && <DateField label="Дата окончания" name="endDate" value={course?.endDate ?? undefined} />}
          </div>

          <h3 className={sectionHeading}>Препараты и расписание</h3>
          <p className="text-sm text-text-secondary">Приём каждый день в указанное время.</p>
          {options.size === 0 && <p className="text-sm">Сначала добавьте лекарство в аптечку.</p>}
          {rows.map(({ id, value }) => (
            <MedicineFields key={id} value={value}
              options={[...options.values()].filter((item) =>
                item.id === value.medicineId || !rows.some((row) => row.id !== id && row.value.medicineId === item.id)
              )}
              onChange={(next) => setRows((current) => current.map((row) => row.id === id ? { id, value: next } : row))}
              onRemove={() => setRows((current) => current.filter((row) => row.id !== id))}
            />
          ))}
          <button type="button" disabled={rows.length >= Math.min(20, options.size)} className={button} onClick={() => {
            const id = nextRowId.current++;
            setRows((current) => [...current, { id, value: blank() }]);
          }}>Добавить препарат</button>
        </fieldset>

        {error && <p role="alert" className="mt-3 text-sm">{error}</p>}
        <button type="submit" disabled={saving || !rows.length || options.size === 0} className={`${button} mx-auto mt-5 block`}>
          {saving ? "Сохраняем…" : course ? "Сохранить изменения" : "Добавить курс"}
        </button>
      </form>
    </dialog>
  );
}
