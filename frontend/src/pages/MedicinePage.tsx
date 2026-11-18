import { useEffect, useState } from "react";
import AppHeader from "../components/layout/AppHeader";
import Footer from "../components/layout/Footer";
import MedicineCard from "../components/medicine/MedicineCard";
import MedicineFormDialog from "../components/medicine/MedicineFormDialog";
import { isExpired, isLowStock, medicineRequest } from "../api/medicine";
import type { Medicine } from "../api/medicine";

const filters = [
  { label: "Все", matches: () => true },
  { label: "Критические остатки", matches: isLowStock },
  { label: "Просроченные", matches: isExpired },
  { label: "По рецепту", matches: (medicine: Medicine) => medicine.prescriptionRequired }
];

export default function MedicinePage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState(0);
  const [editor, setEditor] = useState<{ medicine: Medicine | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    medicineRequest<{ medicines: Medicine[] }>("", { signal: controller.signal })
      .then(({ medicines }) => setMedicines(medicines))
      .catch((error: Error) => {
        if (!controller.signal.aborted) setError(error.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  const search = query.trim().toLocaleLowerCase("ru");
  const visible = medicines.filter((medicine) =>
    medicine.name.toLocaleLowerCase("ru").includes(search) && filters[filter].matches(medicine)
  );

  async function save(data: Record<string, unknown>) {
    const medicine = editor?.medicine;
    const body = JSON.stringify(data);

    if (medicine) {
      const path = `/${encodeURIComponent(medicine.id)}`;
      const { medicine: updated } = await medicineRequest<{ medicine: Medicine }>(path, {
        method: "PATCH",
        body
      });
      setMedicines((current) => current.map((item) => item.id === updated.id ? updated : item));
    } else {
      const { medicine: created } = await medicineRequest<{ medicine: Medicine }>("", { method: "POST", body });
      setMedicines((current) => [created, ...current]);
    }
    setError("");
  }

  async function remove(medicine: Medicine) {
    if (!window.confirm(`Удалить «${medicine.name}» из аптечки?`)) return;
    setError("");

    try {
      await medicineRequest(`/${encodeURIComponent(medicine.id)}`, { method: "DELETE" });
      setMedicines((current) => current.filter((item) => item.id !== medicine.id));
    } catch (error) {
      setError(error instanceof Error ? error.message : "Не удалось удалить лекарство");
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background-soft">
      <AppHeader activePage="Аптечка" />

      <main className="relative mx-auto w-full max-w-[1100px] flex-1 px-4 py-8 sm:px-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-heading text-[32px] font-bold">Моя аптечка</h1>
          <button type="button" disabled={loading} onClick={() => setEditor({ medicine: null })} className="inline-flex items-center gap-2 rounded-pill bg-olive-accent px-4 py-2 text-sm text-background transition-colors enabled:hover:bg-green-accent enabled:hover:text-text-main disabled:opacity-60">
            <img src="/images/pharmacy/plus.svg" alt="" className="size-5 object-contain" />
            Добавить лекарство
          </button>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <label className="flex min-w-[220px] flex-1 items-center gap-2 rounded-pill bg-card px-4 py-2 ring-1 ring-transparent transition-shadow focus-within:ring-olive-accent">
            <img src="/images/pharmacy/search.svg" alt="" className="size-5 shrink-0 object-contain" />
            <input type="search" aria-label="Поиск по названию лекарства" placeholder="Поиск по названию лекарства…" value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent text-text-main outline-none placeholder:text-text-muted" />
          </label>
          <div role="group" aria-label="Фильтры аптечки" className="flex flex-wrap gap-1 rounded-pill bg-card p-1">
            {filters.map(({ label }, index) => (
              <button key={label} type="button" aria-pressed={filter === index} onClick={() => setFilter(index)} className={`rounded-pill px-3 py-1.5 text-xs ${filter === index ? "bg-green-accent" : "bg-green-bg hover:bg-background-soft"}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {loading && <p role="status">Загрузка аптечки…</p>}
        {error && <p role="alert" className="mb-4 rounded-input bg-card p-3">{error}</p>}
        {!loading && !error && !visible.length && (
          <p className="rounded-card bg-card p-6 text-text-secondary">
            {search || filter ? "По этому запросу ничего не найдено." : "В аптечке пока нет лекарств."}
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {visible.map((medicine) => (
            <MedicineCard key={medicine.id} medicine={medicine} onEdit={() => setEditor({ medicine })} onRemove={() => void remove(medicine)} />
          ))}
        </div>
      </main>

      <Footer />
      {editor && <MedicineFormDialog medicine={editor.medicine} onSave={save} onClose={() => setEditor(null)} />}
    </div>
  );
}
