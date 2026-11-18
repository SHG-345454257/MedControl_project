import { load } from "cheerio";

const sources = [
  { host: "novosibirsk.uteka.ru", home: "/catalog/", product: "/product/", name: "Ютека", regionalHost: true },
  { host: "polza.ru", home: "/novosibirsk/", product: "/novosibirsk/catalog/", name: "POLZAru" },
  { host: "ozerki.ru", home: "/novosibirsk/", searchPath: "/catalog/search/", product: "/novosibirsk/catalog/product/", name: "Озерки" },
  { host: "superapteka.ru", home: "/novosibirsk/", searchPath: "/catalog/search/", product: "/novosibirsk/catalog/product/", name: "СуперАптека" },
  { host: "maksavit.ru", home: "/novosibirsk/products/", brandPath: "/novosibirsk/products/", name: "Максавит" },
  { host: "nsk.zhivika.ru", home: "/", name: "Живика", regionalHost: true },
  { host: "planetazdorovo.ru", home: "/", name: "Планета Здоровья" },
  { host: "farmakopeika.ru", home: "/", name: "Фармакопейка" },
  { host: "aptekiplus.ru", home: "/", name: "Аптеки Плюс" },
  { host: "mpnas.ru", home: "/", name: "Муниципальная аптека" },
  { host: "apteka22.ru", home: "/", name: "ФармДисконт" }
];

const cyrillic = "абвгдеёжзийклмнопрстуфхцчшщъыьэюя";
const latin = [
  "a", "b", "v", "g", "d", "e", "e", "zh", "z", "i", "j", "k", "l", "m", "n",
  "o", "p", "r", "s", "t", "u", "f", "h", "c", "ch", "sh", "shch", "", "y", "", "e", "yu", "ya"
];

const cache = new Map();

function sameOrigin(value, base) {
  try {
    const url = new URL(value, base);
    if (url.origin !== new URL(base).origin || url.username || url.password) return null;
    url.hash = "";
    return url;
  } catch {
    return null;
  }
}

function normalize(text) {
  return String(text).toLowerCase().replaceAll("ё", "е").replace(/\s+/g, " ").trim();
}

export function matchesProduct(name, medicine) {
  const title = normalize(name).replace(/^купить\s+/, "");
  const brand = normalize(medicine.name);
  if (!brand || !title.startsWith(brand)) return false;

  const suffix = title.slice(brand.length).trimStart();
  if (suffix && !/^[\s,\d–(-]|^(?:таблетки|табл\.|капсулы|капли|гель|мазь|раствор|спрей|сироп|порошок)(?=\s|,|$)/u.test(suffix)) {
    return false;
  }

  if (!medicine.strengthValue || !medicine.strengthUnit) return true;

  const doses = [...suffix.matchAll(/(\d+(?:[.,]\d+)?)\s*(мкг|мг|мл|г|ме|ед|%)(?![а-яa-z])/giu)];
  if (doses.length !== 1 || /[+＋]/.test(suffix)) return false;

  const [, value, unit] = doses[0];
  return Number(value.replace(",", ".")) === Number(medicine.strengthValue) &&
    unit === normalize(medicine.strengthUnit).replace(/\.$/, "");
}

function structuredProducts(value) {
  if (Array.isArray(value)) return value.flatMap(structuredProducts);
  if (!value || typeof value !== "object") return [];
  if ([value["@type"]].flat().includes("Product")) return [value];
  return structuredProducts(value["@graph"]);
}

export function parseOffer(html, url, source, medicine) {
  const $ = load(html);
  const heading = $("h1").first().text().trim();
  const products = $('script[type="application/ld+json"]').toArray().flatMap((node) => {
    try {
      return structuredProducts(JSON.parse($(node).text()));
    } catch {
      return [];
    }
  });

  for (const product of products) {
    const name = String(product.name || heading).trim();
    if (!matchesProduct(name, medicine) || (heading && !matchesProduct(heading, medicine))) continue;

    for (const offer of [product.offers].flat()) {
      if (String(offer?.priceCurrency).toUpperCase() !== "RUB") continue;
      if (/(OutOfStock|SoldOut|Discontinued)$/.test(String(offer.availability))) continue;

      const price = Number(String(offer.price ?? offer.lowPrice).replace(",", "."));
      if (!Number.isFinite(price) || price <= 0) continue;

      return {
        id: url,
        pharmacyName: source.name,
        productName: name,
        price: price.toFixed(2),
        currency: "RUB",
        priceFrom: offer.price == null,
        productUrl: url
      };
    }
  }

  const meta = (name) => $(`meta[property="${name}"]`).attr("content");
  const price = Number(String(meta("product:price:amount") ?? "").replace(",", "."));

  if (
    matchesProduct(heading, medicine) &&
    meta("product:price:currency") === "RUB" &&
    !/out.?of.?stock|sold.?out|discontinued/i.test(meta("product:availability") ?? "") &&
    Number.isFinite(price) &&
    price > 0
  ) {
    return {
      id: url,
      pharmacyName: source.name,
      productName: heading,
      price: price.toFixed(2),
      currency: "RUB",
      productUrl: url
    };
  }

  return null;
}

async function getPage(url, signal) {
  try {
    const response = await fetch(url, {
      redirect: "error",
      signal,
      headers: { Accept: "text/html", "Accept-Language": "ru-RU" }
    });
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  }
}

function searchForm(html, base, name) {
  const $ = load(html);

  for (const node of $("form[action]").toArray()) {
    const form = $(node);
    if ((form.attr("method") ?? "get").toLowerCase() !== "get") continue;

    const input = form.find(
      'input[type="search"][name], input[name="q"], input[name="query"], input[name="search"]'
    ).first();
    const action = form.attr("action");
    if (!input.length || !action) continue;

    const url = sameOrigin(action, base);
    if (!url) continue;

    for (const field of form.find('input[type="hidden"][name]').toArray()) {
      const key = $(field).attr("name");
      const value = $(field).attr("value");
      if (key && value && /^(city|region|regionId|cityId)$/i.test(key)) {
        url.searchParams.set(key, value);
      }
    }

    url.searchParams.set(input.attr("name"), name);
    return url.href;
  }

  return null;
}

function matchingLinks(html, base, medicine, source) {
  const $ = load(html);
  const links = new Set();
  const brand = normalize(medicine.name);

  for (const node of $("a[href]").toArray()) {
    const anchor = $(node);
    const title = normalize(anchor.text() || anchor.attr("title") || "");
    if (title !== brand && !matchesProduct(title, medicine)) continue;

    const url = sameOrigin(anchor.attr("href"), base);
    if (!url || url.href === base || url.pathname === "/") continue;
    if (source.product && !url.pathname.startsWith(source.product)) continue;

    links.add(url.href);
    if (links.size >= 5) break;
  }

  return [...links];
}

function isNovosibirsk(url, source) {
  return source.regionalHost || /\/(novosibirsk|novosibirskij)(\/|$)/i.test(new URL(url).pathname);
}

function catalogSlug(name) {
  return normalize(name).replace(/[а-я]/g, (letter) => latin[cyrillic.indexOf(letter)])
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function buildSearch(source, home, medicine) {
  if (!source.searchPath) return null;

  const url = new URL(source.searchPath, home);
  const query = [medicine.name, medicine.strengthValue, medicine.strengthUnit]
    .filter(Boolean).join(" ");
  url.searchParams.set("q", query);
  return url.href;
}

async function loadCatalog(source, medicine) {
  const home = `https://${source.host}${source.home}`;
  const signal = AbortSignal.timeout(20000);
  let search = buildSearch(source, home, medicine);
  const slug = source.brandPath ? catalogSlug(medicine.name) : "";
  const brandPage = slug ? new URL(`${source.brandPath}${slug}/`, home).href : null;

  const [homeHtml, brandHtml, directSearchHtml] = await Promise.all([
    getPage(home, signal),
    brandPage ? getPage(brandPage, signal) : null,
    search ? getPage(search, signal) : null
  ]);

  const formSearch = homeHtml ? searchForm(homeHtml, home, medicine.name) : null;
  const formHtml = formSearch && formSearch !== search ? await getPage(formSearch, signal) : null;
  if (!search) search = formSearch;

  const pages = [
    [directSearchHtml, search],
    [formHtml, formSearch],
    [brandHtml, brandPage],
    [homeHtml, home]
  ].filter(([html, address]) => html && address);

  const candidates = [...new Set(pages.flatMap(([html, address]) =>
    matchingLinks(html, address, medicine, source)
  ))].filter((url) => isNovosibirsk(url, source)).slice(0, 5);

  const offers = new Map();
  if (brandHtml && isNovosibirsk(brandPage, source)) {
    const offer = parseOffer(brandHtml, brandPage, source, medicine);
    if (offer) offers.set(offer.productUrl, offer);
  }

  const productPages = await Promise.all(candidates.map(async (url) => {
    const html = await getPage(url, signal);
    return html ? parseOffer(html, url, source, medicine) : null;
  }));

  for (const offer of productPages) {
    if (offer) offers.set(offer.productUrl, offer);
  }

  return {
    offers: [...offers.values()],
    catalogUrl: search || (brandHtml ? brandPage : home),
    status: offers.size ? "found" : pages.length ? "empty" : "unavailable"
  };
}

export const onlineSourceIds = sources.map(({ host }) => host);

export const pharmacyCatalogs = sources.map(({ host, home, name }) => ({
  url: `https://${host}${home}`,
  title: name
}));

export async function getOnlinePharmacyOffers(medicine, sourceId) {
  const source = sources.find(({ host }) => host === sourceId);
  if (!source) return { status: "unavailable" };

  const key = JSON.stringify([
    sourceId, normalize(medicine.name), medicine.strengthValue, medicine.strengthUnit
  ]);
  const existing = cache.get(key);
  if (existing && existing.expires > Date.now()) return existing.promise;

  const promise = loadCatalog(source, medicine).catch(() => ({ status: "unavailable" }));
  if (cache.size >= 100) cache.delete(cache.keys().next().value);
  cache.set(key, { expires: Date.now() + 2 * 60_000, promise });
  return promise;
}