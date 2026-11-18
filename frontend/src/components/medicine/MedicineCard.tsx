import { Link } from "react-router-dom";
import { isExpired, isLowStock, medicineIcon } from "../../api/medicine";
import type { Medicine } from "../../api/medicine";

type MedicineCardProps = {
  medicine: Medicine;
  onEdit: () => void;
  onRemove: () => void;
};

export default function MedicineCard({ medicine, onEdit, onRemove }: MedicineCardProps) {
  const badges = [
    { visible: medicine.prescriptionRequired, icon: "recipe", label: "По рецепту" },
    { visible: isLowStock(medicine), icon: "remains", label: "Критический остаток" },
    { visible: isExpired(medicine), icon: "expired", label: "Просрочено" }
  ];

  return (
    <article className="flex min-h-48 min-w-0 flex-col rounded-card bg-card p-3 shadow-card sm:p-4">
      <div className="flex items-start justify-between gap-1">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <div className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-full bg-lilac-light">
            <img
              src={medicineIcon(medicine.form)}
              alt=""
              className="size-6 object-contain"
            />
          </div>

          {badges.filter((badge) => badge.visible).map((badge) => (
            <img
              key={badge.icon}
              src={`/images/pharmacy/${badge.icon}.svg`}
              alt={badge.label}
              title={badge.label}
              className="size-5 shrink-0 object-contain"
            />
          ))}
        </div>

        <details className="relative shrink-0">
          <summary className="grid size-8 cursor-pointer list-none place-items-center rounded-input hover:bg-background-soft [&::-webkit-details-marker]:hidden">
            <img src="/images/pharmacy/menu.svg" alt={`Действия: ${medicine.name}`} className="size-5 object-contain" />
          </summary>

          <div className="absolute right-0 z-10 grid w-32 gap-1 rounded-input bg-card p-2 shadow-card">
            <button type="button" onClick={onEdit} className="rounded-pill bg-green-bg px-2 py-1.5 text-sm hover:bg-green-accent">
              Изменить
            </button>
            <button type="button" onClick={onRemove} className="rounded-pill bg-green-bg px-2 py-1.5 text-sm hover:bg-green-accent">
              Удалить
            </button>
          </div>
        </details>
      </div>

      <h2 className="mb-4 mt-3 break-words font-heading text-lg font-bold leading-tight">{medicine.name}</h2>

      <Link
        to={`/medicine/${encodeURIComponent(medicine.id)}`}
        className="mt-auto flex min-h-9 items-center gap-2 rounded-input bg-background-soft px-2 py-1.5 text-xs text-text-secondary hover:bg-green-bg"
      >
        <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-green-accent" />
        <span className="min-w-0 break-words">Остаток: {medicine.quantity} {medicine.quantityUnit}</span>
        <span aria-hidden="true" className="ml-auto text-lg leading-none">›</span>
      </Link>
    </article>
  );
}
