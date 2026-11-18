import { useEffect, useState } from "react";
import { medicineRequest } from "../../api/medicine";
import type { MedicineOffer } from "../../api/medicine";

type OfferSourceResult = {
  status: "found" | "empty" | "disabled" | "unavailable";
  catalogUrl?: string;
  offers?: MedicineOffer[];
};

type PharmacyOffersProps = {
  medicineId: string;
  savedOffers: MedicineOffer[];
  sources: string[];
  catalogs: { url: string; title: string }[];
};

function displayPrice(offer: MedicineOffer) {
  return Number(offer.price).toLocaleString("ru-RU", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }) + (offer.currency === "RUB" ? " ₽" : ` ${offer.currency}`);
}

export default function PharmacyOffers({
  medicineId,
  savedOffers,
  sources,
  catalogs
}: PharmacyOffersProps) {
  const [results, setResults] = useState<Record<string, OfferSourceResult>>({});

  useEffect(() => {
    const controller = new AbortController();

    for (const source of sources) {
      const path = `/${encodeURIComponent(medicineId)}/offers/${encodeURIComponent(source)}`;
      medicineRequest<OfferSourceResult>(path, { signal: controller.signal })
        .catch((): OfferSourceResult => ({ status: "unavailable" }))
        .then((result) => {
          if (!controller.signal.aborted) {
            setResults((current) => ({ ...current, [source]: result }));
          }
        });
    }

    return () => controller.abort();
  }, [medicineId, sources]);

  const pending = sources.filter((source) => !results[source]).length;
  const combined = new Map(savedOffers.map((offer) => [offer.productUrl, offer]));

  for (const result of Object.values(results)) {
    for (const offer of result.offers ?? []) {
      combined.set(offer.productUrl, offer);
    }
  }

  const offers = [...combined.values()].sort((a, b) => Number(a.price) - Number(b.price));
  const pharmaciesWithOffers = new Set(offers.map(({ pharmacyName }) => pharmacyName));

  const catalogCards = catalogs
    .filter(({ title }) => !pharmaciesWithOffers.has(title))
    .map(({ url, title }) => {
      const result = results[new URL(url).hostname];

      return {
        key: `catalog:${url}`,
        title,
        description: result ? "Уточните цену и наличие на сайте" : "Проверяем цену и наличие…",
        url: result?.catalogUrl ?? url,
        action: "Открыть каталог"
      };
    });

  if (
    results.apteka?.status === "unavailable" &&
    results.apteka.catalogUrl &&
    !pharmaciesWithOffers.has("Аптека.ру")
  ) {
    catalogCards.push({
      key: "catalog:apteka",
      title: "Аптека.ру",
      description: "Уточните цену и наличие на сайте",
      url: results.apteka.catalogUrl,
      action: "Открыть каталог"
    });
  }

  const cards = [
    ...offers.map((offer) => ({
      key: `offer:${offer.productUrl}`,
      title: offer.pharmacyName,
      description: offer.productName,
      price: (offer.priceFrom ? "от " : "") + displayPrice(offer),
      url: offer.productUrl,
      action: "Купить"
    })),
    ...catalogCards.map((card) => ({ ...card, price: null }))
  ];

  return (
    <section className="mt-6 w-full min-w-0 border-t border-green-accent pt-4">
      <h2 className="font-heading text-2xl font-bold">Цены в онлайн-аптеках</h2>

      <p className="mt-2 text-sm text-text-secondary">
        Новосибирск. Цену и наличие уточняйте на сайте.
      </p>

      {pending > 0 && (
        <p role="status" className="mt-2 text-sm text-text-secondary">
          Ищем предложения…
        </p>
      )}

      {pending === 0 && cards.length === 0 && (
        <p className="mt-3 text-sm text-text-secondary">Цены получить не удалось.</p>
      )}

      {cards.length > 0 && (
        <div
          role="region"
          aria-label="Карточки аптек"
          tabIndex={0}
          className="mt-3 flex w-full min-w-0 flex-nowrap gap-3 overflow-x-auto pb-3"
        >
          {cards.map(({ key, title, description, price, url, action }) => (
            <article
              key={key}
              className="flex w-64 min-w-0 max-w-[85%] shrink-0 flex-col gap-2 rounded-card bg-card p-4"
            >
              <h3 className="break-words font-heading font-bold">{title}</h3>
              <p className="break-words text-sm text-text-secondary">{description}</p>

              <div className="mt-auto flex flex-col gap-2">
                {price && <p className="font-heading font-bold">{price}</p>}

                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${action} — ${title}`}
                  className="flex items-center justify-center gap-2 rounded-pill bg-olive-accent px-3 py-2 text-sm text-background hover:bg-green-accent hover:text-text-main"
                >
                  {action}
                  <img
                    src="/images/arrow.svg"
                    alt=""
                    className="size-4 shrink-0 object-contain"
                  />
                </a>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}