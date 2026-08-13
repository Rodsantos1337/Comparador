/** Search query validation for the store API routes. */
export function parseSearchQuery(raw: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Non-negative integer pagination offset, defaulting to 0. */
export function parseStart(raw: string | null): number {
  const n = Number(raw);
  return Number.isInteger(n) && n >= 0 ? n : 0;
}

/**
 * Suggestions only make sense from two characters onwards; anything shorter
 * yields an empty result set rather than an error.
 */
export function parseSuggestionsQuery(raw: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  return trimmed.length >= 2 ? trimmed : null;
}