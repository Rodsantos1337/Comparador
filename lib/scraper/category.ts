/**
 * Category helpers shared by the store parsers.
 *
 * Continente exposes a full breadcrumb in the tile impression JSON
 * ("Supermercado/Mercearia/Arroz, Massa e Farinha/Arroz"); Pingo Doce exposes no
 * category at all, but its product URL path is the breadcrumb
 * ("/home/produtos/mercearia/arroz-massa-e-leguminosas/arroz/<product>.html").
 * Both are normalised to the leaf so consumers get one consistent string.
 */

const ZERO_WIDTH = /[\u200B-\u200D\uFEFF\u2060]/g;

/** "arroz-massa-e-leguminosas" -> "Arroz Massa E Leguminosas" */
function humanizeSlug(slug: string): string {
  return slug
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/(^|\s)(\p{L})/gu, (_match, space: string, letter: string) => `${space}${letter.toUpperCase()}`);
}

/** Last segment of a breadcrumb such as "Supermercado/Mercearia/Arroz" -> "Arroz". */
export function leafCategory(breadcrumb: string | null | undefined): string {
  if (!breadcrumb) return "";
  const segments = breadcrumb
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean);
  return segments.length > 0 ? segments[segments.length - 1] : "";
}

/**
 * Derives the leaf category from a Pingo Doce product URL. The segment before
 * the product slug is the most specific category the store publishes, which is
 * the same depth Continente's breadcrumb ends at.
 */
export function categoryFromProductUrl(url: string | null | undefined): string {
  if (!url) return "";

  let pathname: string;
  try {
    pathname = new URL(url).pathname;
  } catch {
    return "";
  }

  const segments = pathname
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean);

  const produtoIndex = segments.indexOf("produtos");
  if (produtoIndex === -1) return "";

  // Drop the trailing product slug ("...-651101.html") — everything before it
  // is the category breadcrumb.
  const breadcrumb = segments.slice(produtoIndex + 1, -1);
  if (breadcrumb.length === 0) return "";

  const raw = breadcrumb[breadcrumb.length - 1];
  let decoded: string;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    decoded = raw;
  }

  return humanizeSlug(decoded.replace(ZERO_WIDTH, ""));
}
