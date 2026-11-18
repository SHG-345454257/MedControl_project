import { load } from "cheerio";

const host = "https://apteka.ru";
const city = "novosibirsk";
const cyrillic = "абвгдеёжзийклмнопрстуфхцчшщъыьэюя";
const latin = [
  "a", "b", "v", "g", "d", "e", "e", "zh", "z", "i", "j", "k", "l", "m", "n",
  "o", "p", "r", "s", "t", "u", "f", "h", "c", "ch", "sh", "shch", "", "y", "", "e", "yu", "ya"
];

function normalize(value) {
  return String(value).toLowerCase().replaceAll("ё", "е").replace(/\s+/g, " ").trim();
}

function slug(name) {
  return normalize(name).replace(/[а-я]/g, (letter) => latin[cyrillic.indexOf(letter)])
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const dosagePattern = /(\d+(?:[.,]\d+)?)\s*(мкг|мг|мл|г|ме|ед|%)(?=$|[^а-яa-z])/gi;

function matchesProduct(title, medicine) {
  const normalizedTitle = normalize(title);
  const suffix = normalizedTitle.slice(normalize(medicine.name).length);
  const name = normalize(medicine.name);
  if (!normalizedTitle.startsWith(name) || /^[\p{L}\p{N}]/u.test(suffix)) return false;

  if (!medicine.strengthValue || !medicine.strengthUnit) return true;

  // Reject differently named variants and combination products.
  const strength = [...suffix.matchAll(dosagePattern)];
  if (!/^\s*[,–-]?\s*\d/.test(suffix) || strength.length !== 1) return false;

  const [, value, unit] = strength[0];
  return Number(value.replace(",", ".")) === Number(medicine.strengthValue) &&
    normalize(unit) === normalize(medicine.strengthUnit).replace(/\.$/, "");
}

export function parseAptekaOffers(html, medicine) {
  const $ = load(html);
  $("script, style, del, s, strike").remove();
  const offers = new Map();

  $('a[href*="/product/"]').each((_, link) => {
    const anchor = $(link);
    const productName = anchor.text().replace(/\s+/g, " ").trim();
    if (!matchesProduct(productName, medicine)) return;

    let url;
    try {
      url = new URL(anchor.attr("href"), host);
    } catch {
      return;
    }
    if (url.origin !== host || !/^\/(?:novosibirsk\/)?product\//.test(url.pathname)) return;

    for (let card = anchor.parent(); card.length && !card.is("body"); card = card.parent()) {
      const urls = new Set(card.find('a[href*="/product/"]').map((_, item) => {
        return ($(item).attr("href") ?? "").split(/[?#]/)[0];
      }).get());
      if (urls.size !== 1) break;

      const copy = card.clone();
      copy.find("span, div, p").each((_, element) => {
        $(element).append(" ");
      });
      const prices = [...copy.text().matchAll(
        /(\d{1,3}(?:[\u00a0\u202f ]\d{3})+|\d+)(?:\s*[.,]\s*(\d{1,2}))?\s*₽/g
      )];
      if (!prices.length) continue;
      // Ambiguous cards can contain component prices or crossed-out prices.
      const values = new Set(prices.map(([, rubles, kopeks = "0"]) =>
        Number(rubles.replace(/\s/g, "") + "." + kopeks)
      ));
      if (values.size !== 1) break;

      const [price] = values;
      if (!Number.isFinite(price) || price <= 0) break;

      const path = url.pathname.replace(/^\/novosibirsk/, "");
      offers.set(path, {
        id: `apteka:${path}`,
        pharmacyName: "Аптека.ру",
        productName,
        price: price.toFixed(2),
        currency: "RUB",
        productUrl: `${url.origin}${url.pathname}`
      });
      break;
    }
  });

  return [...offers.values()].sort((a, b) => Number(a.price) - Number(b.price)).slice(0, 8);
}

const cache = new Map();

export async function getAptekaOffers(medicine) {
  const brand = slug(medicine.name);
  if (!brand) return { offers: [], status: "empty" };

  const key = JSON.stringify([normalize(medicine.name), medicine.strengthValue, medicine.strengthUnit]);
  const existing = cache.get(key);
  if (existing && existing.expires > Date.now()) return existing.request;

  const catalogUrl = `${host}/${city}/preparation/${brand}/`;
  const request = (async () => {
    try {
      const response = await fetch(catalogUrl, {
        redirect: "error",
        signal: AbortSignal.timeout(15000),
        headers: { Accept: "text/html", "Accept-Language": "ru-RU" }
      });
      if (!response.ok) {
        console.warn("[Аптека.ру] Каталог ответил HTTP", response.status);
        return { offers: [], status: response.status === 404 ? "empty" : "unavailable" };
      }

      const html = await response.text();
      const offers = parseAptekaOffers(html, medicine);
      if (!offers.length) {
        console.warn("[Аптека.ру] HTML получен, но подходящая цена не извлечена");
      }
      return { offers, status: offers.length ? "found" : "unavailable", catalogUrl };
    } catch (error) {
      console.warn("[Аптека.ру] Сбой запроса:", error.name, error.cause?.code ?? "");
      return { offers: [], status: "unavailable", catalogUrl };
    }
  })();
  if (cache.size >= 100) cache.delete(cache.keys().next().value);
  cache.set(key, { expires: Date.now() + 120_000, request });
  return request;
}
