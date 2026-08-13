import { load } from "cheerio";
import { parsePrice, parsePercent } from "@/lib/format";
import { httpGetText } from "./http";
import type { Product, StoreBrand } from "@/lib/types";

const BASE_URL = "https://www.pingodoce.pt";
const BRAND: StoreBrand = "Pingo Doce";
const MAX_SUGGESTIONS = 8;

export const SEARCH_URL = (query: string, start: number): string =>
  `${BASE_URL}/on/demandware.store/Sites-pingo-doce-Site/default/Search-Show?q=${encodeURIComponent(query)}&start=${start}`;

export const SUGGESTIONS_URL = (query: string): string =>
  `${BASE_URL}/on/demandware.store/Sites-pingo-doce-Site/default/SearchServices-GetSuggestions?q=${encodeURIComponent(query)}`;

export interface SearchOptions {
  start?: number;
}

const PRODUCT_SELECTORS = [".product-grid .product", ".product-tile", ".product", ".search-results .product"];

interface Impressions {
  name?: string;
  id?: string | number;
  price?: string | number;
  brand?: string;
  category?: string;
  link?: string;
  image?: string;
}

function parseImpressions(raw: string | undefined): Impressions {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Impressions;
  } catch {
    return {};
  }
}

function cleanName(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw
    .replace(/&[a-z]+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function absolutize(href: string | null | undefined): string | null {
  if (!href) return null;
  return href.startsWith("http") ? href : `${BASE_URL}${href}`;
}

/**
 * Pure parser for the Pingo Doce product-search page. Works from multiple
 * product containers, the optional `data-product-tile-impression` JSON, and
 * `content` attributes on price markup, mirroring the original Express server.
 */
export function parsePingoDoceProducts(html: string): Product[] {
  const $ = load(html);
  const products: Product[] = [];

  let $products = $();
  for (const selector of PRODUCT_SELECTORS) {
    $products = $(selector);
    if ($products.length > 0) break;
  }

  $products.each((index, elem) => {
    const $product = $(elem);
    const baseData = parseImpressions(
      $product.attr("data-product-tile-impression") ||
        $product.find("[data-product-tile-impression]").attr("data-product-tile-impression"),
    );

    const nome = cleanName(
      $product.find(".product-name-link a").first().text().trim() ||
        $product.find("img").first().attr("alt") ||
        $product.find("a").first().attr("title") ||
        baseData.name,
    );

    if (!nome || nome === "Produto sem nome") return;

    const link_produto = absolutize($product.find("a").first().attr("href") || baseData.link);

    let preco: number | null = null;
    const contentPrice = $product.find(".sales .value, .product-price .value").first().attr("content");
    if (contentPrice) preco = Number(contentPrice);

    if (preco === null) {
      for (const selector of [".sales", ".product-price .sales", ".current-price .value", ".price .value", ".price"]) {
        const texto = $product.find(selector).first().text().trim();
        if (texto) {
          preco = parsePrice(texto);
          if (preco !== null) break;
        }
      }
    }

    if (preco === null && baseData.price !== undefined) {
      preco = typeof baseData.price === "number" ? baseData.price : parsePrice(String(baseData.price));
    }

    const preco_por_volume =
      $product.find(".product-unit, .unit-price, .price-per-unit").first().text().trim() || null;

    let pvp_recomendado: number | null = null;
    const listContent = $product.find(".strike-through .value, .list .value").first().attr("content");
    if (listContent) {
      pvp_recomendado = Number(listContent);
    } else {
      const pvpTexto = $product.find(".strike-through, .list-price").first().text().trim();
      pvp_recomendado = parsePrice(pvpTexto);
    }

    const desconto = parsePercent(
      $product.find(".product-tile-promo-label").attr("alt") ||
        $product.find(".product-tile-promo-label").attr("title"),
    );

    const promocao = $product.find(".promotion-message, .campaign-message, .promo-text").first().text().trim() || null;
    const ivazero = $product.find(".badge-iva-zero, .iva-zero, .iva-badge").length > 0;

    const link_imagem =
      $product.find(".product-tile-component-image").first().attr("src") ||
      $product.find(".product-tile-image-link img").first().attr("src") ||
      $product.find("img").first().attr("data-src") ||
      $product.find("img").first().attr("src") ||
      baseData.image ||
      null;

    const id =
      $product.find(".product-cta").attr("data-pid") ||
      $product.find(".wishlist-icon").attr("data-pid") ||
      $product.attr("data-pid") ||
      String(baseData.id ?? `pd-${index}`);

    products.push({
      id,
      brand: BRAND,
      nome,
      price: preco ?? 0,
      desconto,
      pvp_recomendado,
      promocao,
      preco_por_volume,
      category: baseData.category ?? "",
      embalagem: preco_por_volume,
      link_produto,
      link_imagem,
      ivazero,
    });
  });

  return products;
}

/**
 * Parser for the Pingo Doce autocomplete markup (product names inside
 * `.product-suggestion` tiles) with fallback for older attribute-driven markup.
 * Suggestions are filtered to those matching the query keyword.
 */
export function parsePingoDoceSuggestions(html: string, query: string): string[] {
  const $ = load(html);
  const suggestions: string[] = [];

  $(".product-suggestion .product-name, .suggestion-item, .search-suggestion, .autocomplete-item").each((_, elem) => {
    const text = $(elem).text().trim();
    if (text) suggestions.push(text);
  });

  $("[data-suggestion], [data-value], [data-keyword]").each((_, elem) => {
    const text = $(elem).attr("data-suggestion") || $(elem).attr("data-value") || $(elem).attr("data-keyword");
    if (text) suggestions.push(text);
  });

  const needle = query.toLowerCase();
  return [...new Set(suggestions)]
    .filter((text) => text.toLowerCase().includes(needle))
    .slice(0, MAX_SUGGESTIONS);
}

export async function searchPingoDoce(
  query: string,
  options: SearchOptions = {},
): Promise<Product[]> {
  const start = options.start ?? 0;
  const html = await httpGetText(SEARCH_URL(query, start), "pingodoce");
  return parsePingoDoceProducts(html);
}

export async function getPingoDoceSuggestions(query: string): Promise<string[]> {
  const html = await httpGetText(SUGGESTIONS_URL(query), "pingodoce");
  return parsePingoDoceSuggestions(html, query);
}