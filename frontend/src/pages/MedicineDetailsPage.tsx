import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AppHeader from "../components/layout/AppHeader";
import Footer from "../components/layout/Footer";
import PharmacyOffers from "../components/medicine/PharmacyOffers";
import { isExpired, isLowStock, medicineForms, medicineIcon, medicineRequest } from "../api/medicine";
import type { Medicine, MedicineOffer } from "../api/medicine";

type MedicineDetails = {
  medicine: Medicine;
  offers: MedicineOffer[];
  offerSources: string[];
  pharmacyCatalogs: { url: string; title: string }[];
};

function MedicineDetails({ medicine, offers, offerSources, pharmacyCatalogs }: MedicineDetails) {
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const photo = medicine.imageUrl === failedImage ? null : medicine.imageUrl;
  const badges = [
    { active: medicine.prescriptionRequired, name: "По рецепту", icon: "recipe" },
    { active: isLowStock(medicine), name: "Критический остаток", icon: "remains" },
    { active: isExpired(medicine), name: "Просрочено", icon: "expired" }
  ];

  return (
    <>
      <div className="grid grid-cols-[clamp(5.5rem,28vw,10rem)_minmax(0,1fr)] gap-x-3 gap-y-4 sm:grid-cols-[160px_minmax(0,1fr)] sm:items-start sm:gap-5 lg:grid-cols-[160px_minmax(0,1fr)_minmax(0,1.5fr)]">
        <div className="relative grid min-h-[clamp(5.5rem,28vw,10rem)] place-items-center overflow-hidden rounded-card bg-card sm:aspect-square sm:min-h-0">
          {photo ? (
            <img
              src={photo}
              alt={medicine.name}
              className="absolute inset-0 size-full object-cover"
              onError={() => setFailedImage(photo)}
            />
          ) : (
            <img src={medicineIcon(medicine.form)} alt="" className="size-10 object-contain sm:size-16" />
          )}
        </div>

        <div className="flex min-w-0 flex-col justify-between gap-2 sm:justify-start sm:gap-5">
          <div>
            <h1 className="break-words font-heading text-[clamp(1.25rem,5vw,2rem)] font-bold leading-tight">{medicine.name}</h1>
            <p className="mt-1 text-sm text-text-secondary">
              {medicineForms[medicine.form]}
              {medicine.strengthValue && `, ${medicine.strengthValue} ${medicine.strengthUnit ?? ""}`}
            </p>
          </div>
          <div>
            <p className="text-sm text-text-secondary">
              Остаток в аптечке: <strong>{medicine.quantity} {medicine.quantityUnit}</strong>
            </p>
            {medicine.expiryDate && (
              <p className="mt-1 text-sm text-text-secondary sm:mt-2">Годен до {medicine.expiryDate.split("-").reverse().join(".")}</p>
            )}
          </div>
        </div>

        <div className="col-span-2 lg:col-span-1">
          <div className="flex flex-wrap gap-2">
            {badges.filter((badge) => badge.active).map((badge) => (
              <span key={badge.icon} className="inline-flex items-center gap-2 rounded-pill bg-warning/20 px-2 py-1 text-xs">
                <img src={`/images/pharmacy/${badge.icon}.svg`} alt="" className="size-4" />
                {badge.name}
              </span>
            ))}
          </div>
          <h2 className="mt-3 font-heading font-bold">Моя заметка</h2>
          <p className="mt-2 min-h-20 whitespace-pre-wrap break-words rounded-card bg-card p-4 text-sm text-text-secondary">
            {medicine.note || "Заметки пока нет."}
          </p>
        </div>
      </div>

      <PharmacyOffers key={medicine.id} medicineId={medicine.id} savedOffers={offers} sources={offerSources} catalogs={pharmacyCatalogs} />
    </>
  );
}

export default function MedicineDetailsPage() {
  const { id = "" } = useParams();
  const [data, setData] = useState<MedicineDetails | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setData(null);
    setError("");
    medicineRequest<MedicineDetails>(`/${encodeURIComponent(id)}`, { signal: controller.signal })
      .then((result) => {
        if (!controller.signal.aborted) setData(result);
      })
      .catch((error: Error) => {
        if (!controller.signal.aborted) setError(error.message);
      });
    return () => controller.abort();
  }, [id]);

  return (
    <div className="flex min-h-screen flex-col bg-background-soft">
      <AppHeader activePage="Аптечка" />
      <main className="mx-auto w-full max-w-[1100px] flex-1 px-4 py-8 sm:px-6">
        <Link to="/medicine" className="mb-4 inline-flex items-center gap-2 text-sm text-text-secondary hover:underline">
          <img src="/images/medicines/back.svg" alt="" className="size-5 shrink-0 object-contain" />
          Назад в аптечку
        </Link>
        {error && <p role="alert">{error}</p>}
        {!data && !error && <p role="status">Загрузка лекарства…</p>}
        {data?.medicine.id === id && <MedicineDetails {...data} />}
      </main>
      <Footer />
    </div>
  );
}
