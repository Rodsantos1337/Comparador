import { load } from "cheerio";
import { parsePrice } from "@/lib/format";
import { BROWSER_HEADERS, httpGetText } from "./http";
import type { Product, StoreBrand } from "@/lib/types";

const BASE_URL = "https://www.continente.pt";
const BRAND: StoreBrand = "Continente";
const MAX_SUGGESTIONS = 8;

export const SEARCH_URL = (query: string, start: number): string =>
  `${BASE_URL}/pesquisa/?q=${encodeURIComponent(query)}&start=${start}&srule=Continente&pmin=0.01`;

export const SUGGESTIONS_URL = (query: string): string =>
  `${BASE_URL}/on/demandware.store/Sites-continente-Site/default/SearchServices-GetSuggestions?q=${encodeURIComponent(query)}`;

export interface SearchOptions {
  start?: number;
}

interface Impressions {
  name?: string;
  id?: string | number;
  price?: number;
  url?: string;
  category?: string;
}

function parseImpressions(attr: string | undefined): Impressions {
  if (!attr) return {};
  try {
    return JSON.parse(attr) as Impressions;
  } catch {
    return {};
  }
}

function absolutize(href: string | null | undefined): string | null {
  if (!href) return null;
  return /^https?:\/\//.test(href) ? href : `${BASE_URL}${href}`;
}

/**
 * "Indisponível" is a stock-availability badge rendered in the same node as
 * promotional messages; it is not a promotion and should not be surfaced as one.
 */
function normalizePromocao(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const text = raw.trim();
  return /^indispon[ií]vel/i.test(text) ? null : text;
}

/**
 * Pure parser for the Continente product-search page. Extracts products from
 * the `data-product-tile-impression` JSON attributes and observable DOM
 * fallbacks, mirroring the original R/Express implementation.
 */
export function parseContinenteProducts(html: string): Product[] {
  const $ = load(html);
  const products: Product[] = [];

  $("div.row.product-grid.no-gutters.gtm-list .product").each((_, elem) => {
    const $product = $(elem);
    const baseData = parseImpressions(
      $product.find("[data-product-tile-impression]").attr("data-product-tile-impression"),
    );

    const nome =
      $product.find(".col-pdp-link").text().replace(/\n/g, "").trim() ||
      baseData.name ||
      $product.find(".ct-product-tile-name").text().trim() ||
      $product.find("h2, .product-name, .tile-name").first().text().trim();

    const link_produto =
      $product.find(".col-pdp-link").attr("href") ||
      baseData.url ||
      $product.find("a").attr("href");

    if (!nome && !baseData.id) return;

    const embalagem = $product.find(".ct-pdp-details .pwc-tile--quantity").text().trim();
    // The discount badge splits the number and the "%" into sibling elements.
    const descontoValue = $product.find(".ct-product-tile-badge-value--pvpr").text().replace(/\n/g, "").trim();
    const descontoQuantifier = $product.find(".ct-product-tile-badge-value--pvpr-quantifier").text().replace(/\n/g, "").trim();
    const desconto =
      descontoValue || descontoQuantifier ? `${descontoValue}${descontoQuantifier}`.replace(/\s+/g, "") : null;

    const pvpTexto = $product
      .find(".pwc-discount-amount")
      .text()
      .replace("PVP Recomendado: ", "")
      .trim();

    // Unit price lives in `.pwc-tile--price-secondary` (e.g. "1,89€/kg") on the
    // current markup, and in `.ct-price-value` on older pages.
    const preco_por_volume =
      $product.find(".pwc-tile--price-secondary").text().replace(/\n/g, "").trim() ||
      $product.find(".ct-price-value").text().replace(/\n/g, "").trim() ||
      null;
    const promocao = normalizePromocao($product.find(".dual-badge-message-text").text().trim());
    const ivazero = $product.find(".ct-product-tile-badge--iva-zero").length > 0;
    const link_imagem = $product.find(".ct-tile-image").attr("data-src") || null;

    const precoPorUnidade = preco_por_volume ? preco_por_volume.replace(/\s*€/g, " €") : null;

    products.push({
      id: String(baseData.id ?? ""),
      brand: BRAND,
      nome,
      price: typeof baseData.price === "number" ? baseData.price : 0,
      desconto,
      pvp_recomendado: parsePrice(pvpTexto),
      promocao,
      preco_por_volume: precoPorUnidade,
      category: baseData.category ?? "",
      embalagem: embalagem || null,
      link_produto: absolutize(link_produto),
      link_imagem,
      ivazero,
    });
  });

  return products;
}

/**
 * Parser for the Continente autocomplete markup: product suggestions
 * (`.suggestion-product-name`) plus categories/phrases (`.suggested-item`).
 * The category-parent span is skipped because it only repeats the breadcrumb.
 */
export function parseContinenteSuggestions(html: string, query: string): string[] {
  const $ = load(html);
  const suggestions: string[] = [];

  $(
    ".suggestion-product-name, .suggested-item:not(.suggestions-category-parent), .suggestion-item, .search-suggestion",
  ).each((_, elem) => {
    const text = $(elem).text().trim();
    if (text) suggestions.push(text);
  });

  const needle = query.toLowerCase();
  return [...new Set(suggestions)]
    .filter((text) => text.toLowerCase().includes(needle))
    .slice(0, MAX_SUGGESTIONS);
}

export async function searchContinente(
  query: string,
  options: SearchOptions = {},
): Promise<Product[]> {
  const start = options.start ?? 0;
  const html = await httpGetText(SEARCH_URL(query, start), "continente");
  return parseContinenteProducts(html);
}

export async function getContinenteSuggestions(query: string): Promise<string[]> {
  const html = await httpGetText(SUGGESTIONS_URL(query), "continente", {
    ...BROWSER_HEADERS,
    "X-Requested-With": "XMLHttpRequest",
  });
  return parseContinenteSuggestions(html, query);
}
