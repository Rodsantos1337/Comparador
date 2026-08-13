export type StoreId = "continente" | "pingodoce";

export interface ScraperErrorOptions {
  cause?: unknown;
  status?: number;
}

/**
 * Error thrown by the scraper layer when fetching or parsing a store page fails.
 * Carries the originating store id so callers can log and map it consistently.
 */
export class ScraperError extends Error {
  readonly store: StoreId;
  readonly status?: number;

  constructor(store: StoreId, message: string, options: ScraperErrorOptions = {}) {
    super(message, options.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = "ScraperError";
    this.store = store;
    this.status = options.status;
  }
}
