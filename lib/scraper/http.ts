import { ScraperError } from "./errors";
import type { StoreId } from "./errors";

export const REQUEST_TIMEOUT_MS = 15_000;

export const BROWSER_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  "Accept-Language": "pt-PT,pt;q=0.9,en;q=0.8",
};

/**
 * Fetch a URL as plain text using browser-like headers, a hard timeout and no
 * response caching. Throws a {@link ScraperError} on network failure or a
 * non-2xx status so callers can react consistently.
 */
export async function httpGetText(
  url: string,
  store: StoreId,
  headers: Record<string, string> = BROWSER_HEADERS,
): Promise<string> {
  try {
    const response = await fetch(url, {
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new ScraperError(
        store,
        `Unexpected HTTP ${response.status} ${response.statusText} for ${url}`,
        { status: response.status },
      );
    }

    return await response.text();
  } catch (cause) {
    if (cause instanceof ScraperError) throw cause;
    throw new ScraperError(store, `Failed to fetch ${url}`, { cause });
  }
}
