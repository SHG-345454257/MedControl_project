import { useEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { medicineForms } from "../../api/medicine";
import type { Medicine } from "../../api/medicine";

type Props = {
  medicine: Medicine | null;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  onClose: () => void;
};

const fieldClass =
  "mt-1 w-full min-w-0 rounded-input border border-text-muted bg-background " +
  "px-3 py-2 text-sm text-text-main placeholder:text-text-muted " +
  "focus:border-olive-accent";

const checkboxClass =
  "relative size-[22px] shrink-0 cursor-pointer appearance-none rounded-input " +
  "border border-text-muted bg-background checked:border-olive-accent checked:bg-olive-accent " +
  "after:absolute after:left-[7px] after:top-[3px] after:hidden after:h-[10px] after:w-[5px] " +
  "after:rotate-45 after:border-b-2 after:border-r-2 after:border-background after:content-[''] " +
  "checked:after:block focus-visible:outline-2 focus-visible:outline-offset-2 " +
  "focus-visible:outline-olive-accent disabled:opacity-60";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block text-sm">{label}{children}</label>;
}

const strengthUnits = ["мкг", "мг", "г", "мл", "МЕ", "ЕД", "%"];
const quantityUnits = ["шт.", "мл", "л", "г", "мг", "доз", "уп."];

function SelectField({
  name,
  value,
  children
}: {
  name: string;
  value: string;
  children: ReactNode;
}) {
  return (
    <span className="relative block">
      <select
        name={name}
        defaultValue={value}
        className={`${fieldClass} appearance-none pr-9`}
      >
        {children}
      </select>
      <img
        src="/images/pharmacy/arrow-down.svg"
        alt=""
        className="pointer-events-none absolute bottom-0 right-3 top-1 my-auto size-4 object-contain"
      />
    </span>
  );
}

function UnitSelect({ name, units, value }: { name: string; units: string[]; value: string }) {
  return (
    <SelectField name={name} value={value}>
      {!units.includes(value) && <option value={value}>{value}</option>}
      {units.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
    </SelectField>
  );
}

async function encodeImage(file: File) {
  if (!/\.(png|jpe?g|svg|webp)$/i.test(file.name)) {
    throw new Error("Выберите PNG, JPEG, SVG или WebP");
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new Error("Размер исходного изображения должен быть не больше 8 МБ");
  }

  const url = URL.createObjectURL(file);

  try {
    const image = new Image();
    image.src = url;
    await image.decode().catch(() => {
      throw new Error("Не удалось открыть изображение");
    });

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Не удалось обработать изображение");

    for (const maxSize of [512, 384, 256, 128]) {
      const scale = Math.min(1, maxSize / Math.max(image.naturalWidth, image.naturalHeight));
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      for (const type of ["image/webp", "image/jpeg"]) {
        const result = canvas.toDataURL(type, 0.82);
        if (result.startsWith(`data:${type};base64,`) && result.length <= 80_000) {
          return result;
        }
      }
    }

    throw new Error("Не удалось уменьшить изображение. Выберите другое фото");
  } finally {
    URL.revokeObjectURL(url);
  }
}

export default function MedicineFormDialog({ medicine, onSave, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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
      const imageFile = fields.get("imageFile");
      fields.delete("imageFile");
      const imageUrl = imageFile instanceof File && imageFile.size > 0
        ? await encodeImage(imageFile)
        : medicine?.imageUrl ?? null;

      await onSave({
        ...Object.fromEntries(fields),
        imageUrl,
        prescriptionRequired: fields.has("prescriptionRequired"),
        notifyWhenLow: fields.has("notifyWhenLow")
      });
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Не удалось сохранить лекарство");
      setSaving(false);
    }
  }

  return (
    <dialog
      ref={dialog}
      aria-labelledby="medicine-form-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!saving) onClose();
      }}
      className="m-auto max-h-[90vh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-card bg-card p-5 text-text-main shadow-card backdrop:bg-black/30 sm:p-7"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 id="medicine-form-title" className="font-heading text-2xl font-bold">
          {medicine ? "Изменить лекарство" : "Добавить лекарство в аптечку"}
        </h2>
        <button type="button" aria-label="Закрыть" disabled={saving} onClick={onClose} className="grid size-9 shrink-0 place-items-center rounded-input hover:bg-green-bg disabled:opacity-60">
          <img src="/images/pharmacy/exit.svg" alt="" className="size-5 object-contain" />
        </button>
      </div>

      <form onSubmit={submit} className="mt-4">
        <fieldset disabled={saving} className="space-y-4">
          <h3 className="rounded-pill bg-green-bg px-3 py-1 text-center font-heading font-bold">Основная информация</h3>
          <Field label="Название">
            <input name="name" required maxLength={120} placeholder="Например, Ибупрофен" defaultValue={medicine?.name} className={fieldClass} />
          </Field>
          <Field label="Форма выпуска">
            <SelectField name="form" value={medicine?.form ?? "TABLET"}>
              {Object.entries(medicineForms).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </SelectField>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Дозировка">
              <input name="strengthValue" inputMode="decimal" placeholder="200" defaultValue={medicine?.strengthValue ?? ""} className={fieldClass} />
            </Field>
            <Field label="Единица дозировки">
              <UnitSelect name="strengthUnit" units={strengthUnits} value={medicine?.strengthUnit || "мг"} />
            </Field>
          </div>

          <h3 className="rounded-pill bg-green-bg px-3 py-1 text-center font-heading font-bold">Учёт и сроки</h3>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Текущий остаток">
              <input name="quantity" required inputMode="decimal" defaultValue={medicine?.quantity ?? "0"} className={fieldClass} />
            </Field>
            <Field label="Единица остатка">
              <UnitSelect name="quantityUnit" units={quantityUnits} value={medicine?.quantityUnit || "шт."} />
            </Field>
            <Field label="Критический остаток">
              <input name="lowStockThreshold" inputMode="decimal" placeholder="Например, 3" defaultValue={medicine?.lowStockThreshold ?? ""} className={fieldClass} />
            </Field>
            <Field label="Годен до">
              <span className="relative block">
                <input
                  name="expiryDate"
                  type="date"
                  defaultValue={medicine?.expiryDate ?? ""}
                  className={`${fieldClass} [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0`}
                />
                <img
                  src="/images/pharmacy/calendar.svg"
                  alt=""
                  className="pointer-events-none absolute bottom-0 right-3 top-1 my-auto hidden size-5 object-contain supports-[selector(input::-webkit-calendar-picker-indicator)]:block"
                />
              </span>
            </Field>
          </div>

          <h3 className="rounded-pill bg-green-bg px-3 py-1 text-center font-heading font-bold">Дополнительно</h3>
          <div className="grid max-w-[340px] gap-2">
            <label className="grid cursor-pointer grid-cols-[1fr_auto] items-center gap-3 text-sm text-text-main">
              <span>Отпускается по рецепту</span>
              <input
                name="prescriptionRequired"
                type="checkbox"
                defaultChecked={medicine?.prescriptionRequired}
                className={checkboxClass}
              />
            </label>

            <label className="grid cursor-pointer grid-cols-[1fr_auto] items-center gap-3 text-sm text-text-main">
              <span>Уведомить, когда будет заканчиваться</span>
              <input
                name="notifyWhenLow"
                type="checkbox"
                defaultChecked={medicine?.notifyWhenLow ?? true}
                className={checkboxClass}
              />
            </label>
          </div>
          <Field label="Фото лекарства">
            <input
              name="imageFile"
              type="file"
              accept=".png,.jpg,.jpeg,.svg,.webp,image/png,image/jpeg,image/svg+xml,image/webp"
              className={fieldClass}
            />
          </Field>
          <Field label="Моя заметка">
            <textarea name="note" maxLength={2000} rows={2} defaultValue={medicine?.note ?? ""} className={fieldClass} />
          </Field>
        </fieldset>

        {error && <p role="alert" className="mt-3 text-sm text-text-main">{error}</p>}
        <button type="submit" disabled={saving} className="mx-auto mt-5 block rounded-pill bg-olive-accent px-6 py-2.5 text-sm text-background transition-colors enabled:hover:bg-green-accent enabled:hover:text-text-main disabled:opacity-60">
          {saving ? "Сохраняем…" : medicine ? "Сохранить изменения" : "Добавить в аптечку"}
        </button>
      </form>
    </dialog>
  );
}
